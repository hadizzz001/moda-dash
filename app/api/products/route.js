import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      title,
      description,
      price,
      discount,
      img,
      category,
      stock,
      arrival,
      color,
      type,
      origin,
      weight,
      profit,
      rate,
      shippingCost,
      landing,
      profitAmount,
      date,
    } = body;

    console.log("body are: ", body);



    const product = await prisma.product.create({
      data: {
        title,
        description,
        price,
        discount,
        img,
        category,
        stock,
        arrival,
        color,
        type,
        origin,
        weight,
        profit,
        rate,
        shippingCost,
        landing,
        profitAmount,
        date,

      },
    });



    return new Response(JSON.stringify({ message: 'Product created successfully', product }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating product:', error);
    return new Response(JSON.stringify({ error: 'Failed to create product' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function GET(req) {
  try {
    const products = await prisma.product.findMany({
      orderBy: { id: 'desc' }
    });

    return new Response(JSON.stringify(products), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch products' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}














export async function DELETE(request, { params }) {

  try {

    await prisma.product.deleteMany({
    });

    return new Response(
      JSON.stringify({ message: 'Product deleted successfully' }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting product:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to delete product' }),
      { status: 500 }
    );
  }
}
