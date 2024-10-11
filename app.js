const multer = require('multer');
const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');

const storage = multer.memoryStorage();
// this is a function, process the image in RAM
const upload = multer({ storage: storage });

const { getProducts, addNewProduct } = require('./data');

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
// upload.single('image') is a middleware function, the "image" has to match the name field in the Formdata
app.post('/product', upload.single('image'), async function (req, res) {
  //console.log('endpoint /product, body:', req.body);
  //console.log('endpoint /product, file:', req.file);

  //upload the image to s3 with ProductId.xxx as name
  //create dynamodb record
  await addNewProduct(req);

  res.status(201).json({ message: 'created!', item: req.body });
});

// API Endpoint: GET /ec2metadata
app.get('/ec2metadata', async function (req, res) {
  getInstanceMetadata()
    .then((metadata) => {
      res.json(metadata);
    })
    .catch((err) => {
      console.error('Error fetching metadata:', err);
    });
});

// // API Endpoint: GET /products/:id
// app.get('/products/:id', async function (req, res) {
//   const productId = req.params.id;
//   const product = await getProduct(productId);
//   res.json(product);
// });

// // API Endpoint: POST /comment
// app.post('/comment', async function (req, res) {
//   const submittedData = req.body;
//   const productId = submittedData.productId;
//   const commentData = {
//     title: submittedData.title,
//     user: submittedData.user,
//     text: submittedData.text,
//   };
//   await addNewComment(productId, commentData);
//   res.status(201).json({ message: 'comment created!', commentData });
// });

//----
export function getInstanceMetadata() {
  return new Promise((resolve, reject) => {
    // Get the instance ID
    http
      .get('http://169.254.169.254/latest/meta-data/instance-id', (res) => {
        let instanceId = '';

        res.on('data', (chunk) => {
          instanceId += chunk.toString();
        });

        res.on('end', () => {
          // Get the availability zone
          http
            .get(
              'http://169.254.169.254/latest/meta-data/placement/availability-zone',
              (res) => {
                let availabilityZone = '';

                res.on('data', (chunk) => {
                  availabilityZone += chunk.toString();
                });

                res.on('end', () => {
                  resolve({
                    instanceId,
                    availabilityZone,
                  });
                });
              }
            )
            .on('error', reject);
        });
      })
      .on('error', reject);
  });
}
//----

app.listen(port, () => {
  console.log(`listening on :${port}`);
});
