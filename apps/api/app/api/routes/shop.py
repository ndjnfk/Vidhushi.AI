from fastapi import APIRouter, Depends, HTTPException

from app.core.deps import get_current_user
from app.models.models import Product, ShopOrder, ShopOrderItem, ShippingAddress, User
from app.payments.base import PaymentGatewayError
from app.payments.booking import create_order_for_booking
from app.schemas.schemas import CheckoutIn, ProductOut, ShopOrderItemOut, ShopOrderOut

router = APIRouter(prefix="/shop", tags=["shop"])


def _product_out(p: Product) -> ProductOut:
    return ProductOut(
        id=str(p.id), name=p.name, description=p.description, price=p.price,
        image_url=p.image_url, category=p.category, stock_quantity=p.stock_quantity,
    )


def _shop_order_out(o: ShopOrder, order_out=None) -> ShopOrderOut:
    return ShopOrderOut(
        id=str(o.id),
        items=[ShopOrderItemOut(**item.model_dump()) for item in o.items],
        total_amount=o.total_amount,
        status=o.status,
        order=order_out,
    )


@router.get("/products", response_model=list[ProductOut])
async def list_products(category: str | None = None):
    query: dict = {"is_active": True}
    if category:
        query["category"] = category
    products = await Product.find(query).to_list()
    return [_product_out(p) for p in products]


@router.get("/products/{product_id}", response_model=ProductOut)
async def get_product(product_id: str):
    product = await Product.get(product_id)
    if product is None or not product.is_active:
        raise HTTPException(status_code=404, detail="Product not found")
    return _product_out(product)


@router.post("/checkout", response_model=ShopOrderOut)
async def checkout(payload: CheckoutIn, user: User = Depends(get_current_user)):
    if not payload.items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    order_items: list[ShopOrderItem] = []
    total = 0.0
    for cart_item in payload.items:
        product = await Product.get(cart_item.product_id)
        if product is None or not product.is_active:
            raise HTTPException(status_code=404, detail=f"Product {cart_item.product_id} not found")
        if product.stock_quantity < cart_item.quantity:
            raise HTTPException(status_code=400, detail=f"'{product.name}' has only {product.stock_quantity} in stock")
        order_items.append(ShopOrderItem(
            product_id=str(product.id), product_name=product.name,
            quantity=cart_item.quantity, unit_price=product.price,
        ))
        total += product.price * cart_item.quantity

    shop_order = ShopOrder(
        user_id=str(user.id),
        items=order_items,
        shipping_address=ShippingAddress(**payload.shipping_address.model_dump()),
        total_amount=round(total, 2),
    )
    await shop_order.insert()

    try:
        order, order_out = await create_order_for_booking(
            user_id=str(user.id), item_type="shop", item_ref_id=str(shop_order.id),
            amount=shop_order.total_amount, notes={"product_info": "Shop order", "email": user.email},
            gateway_override=payload.gateway,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except PaymentGatewayError as e:
        raise HTTPException(status_code=502, detail=str(e))

    shop_order.order_id = str(order.id)
    await shop_order.save()

    return _shop_order_out(shop_order, order_out)


@router.get("/orders/{order_id}", response_model=ShopOrderOut)
async def get_order(order_id: str, user: User = Depends(get_current_user)):
    shop_order = await ShopOrder.get(order_id)
    if shop_order is None or shop_order.user_id != str(user.id):
        raise HTTPException(status_code=404, detail="Order not found")
    return _shop_order_out(shop_order)
