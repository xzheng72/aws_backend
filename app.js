const express = require('express');
const bodyParser = require('body-parser');

const {
  getProducts,
  addNewProduct,
  addNewComment,
  getProduct,
} = require('./data');

const app = express();
port = 3001;

// Middleware to parse JSON requests
app.use(express.json());

// API Endpoint: GET /products
app.get('/products', async function (req, res) {
  const products = await getProducts();
  res.json(products);
});

// API Endpoint: POST /product
app.post('/product', async function (req, res) {
  const productData = req.body;
  await addNewProduct(productData);
  res.status(201).json({ message: 'created!', productData });
});

// API Endpoint: GET /products/:id
app.get('/products/:id', async function (req, res) {
  const productId = req.params.id;
  const product = await getProduct(productId);
  res.json(product);
});

// API Endpoint: POST /comment
app.post('/comment', async function (req, res) {
  const submittedData = req.body;
  const productId = submittedData.productId;
  const commentData = {
    title: submittedData.title,
    user: submittedData.user,
    text: submittedData.text,
  };
  await addNewComment(productId, commentData);
  res.status(201).json({ message: 'comment created!', commentData });
});

//----

//-----

app.listen(port, () => {
  console.log(`listening on :${port}`);
});
