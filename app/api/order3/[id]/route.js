import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PATCH(req, { params }) {
  const { id } = params;

  try {
    const body = await req.json();
    const { newItem } = body;

    if (!newItem || !id) {
      return Response.json({ error: 'Missing required data' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: id },
    });

    if (!order) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }

    const currentUserInfo = Array.isArray(order.userInfo) ? order.userInfo : [];

    const quantity = parseInt(newItem.quantity, 10);
    const discountPrice = parseFloat(newItem.discount);

    if (isNaN(quantity) || isNaN(discountPrice)) {
      return Response.json({ error: 'Invalid quantity or discount price' }, { status: 400 });
    }

    let productFound = false;

    const updatedUserInfo = currentUserInfo.map(item => {
      const sameId = item.id === newItem.id || item._id === newItem.id;

      // Case 1: No color or size
      if (sameId && !newItem.selectedColor && !newItem.selectedSize) {
        productFound = true;
        return {
          ...item,
          quantity: parseInt(item.quantity, 10) + quantity,
        };
      }

      // Case 2: Color only
      if (sameId && newItem.selectedColor && !newItem.selectedSize && item.selectedColor === newItem.selectedColor) {
        productFound = true;
        return {
          ...item,
          quantity: parseInt(item.quantity, 10) + quantity,
        };
      }

      // Case 3: Color and Size
      if (
        sameId &&
        newItem.selectedColor &&
        newItem.selectedSize &&
        item.selectedColor === newItem.selectedColor &&
        item.selectedSize === newItem.selectedSize
      ) {
        productFound = true;
        return {
          ...item,
          quantity: parseInt(item.quantity, 10) + quantity,
        };
      }

      // If no match, return item unchanged
      return item;
    });


    if (!productFound) {
      updatedUserInfo.push(newItem);
    }

const getSizePrice = (item) => {
  const colorObj = item.color?.find(c => c.color === item.selectedColor);
  const sizeObj = colorObj?.sizes?.find(s => s.size === item.selectedSize);
  return sizeObj?.price;
};

const sizePrice = getSizePrice(newItem);
const priceToUse = sizePrice ?? discountPrice;
const additionalCost = quantity * priceToUse;

    const updatedTotal = parseFloat(order.total) + additionalCost;

    const updatedOrder = await prisma.order.update({
      where: { id: id },
      data: {
        userInfo: updatedUserInfo,
        total: updatedTotal.toFixed(2),
      },
    });

    return Response.json(
      { message: 'Item added to order', updatedOrder },
      { status: 200 }
    );
  } catch (error) {
    console.error('PATCH /api/order3/[id] error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
