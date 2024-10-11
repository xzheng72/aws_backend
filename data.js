const dotenv = require('dotenv');
const { v4: generateId } = require('uuid');
const dynamodb = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  ScanCommand,
  QueryCommand,
} = require('@aws-sdk/lib-dynamodb');
const {
  S3Client,
  PutObjectCommand: PutObjectCommand_s3,
} = require('@aws-sdk/client-s3');
// use env variables
dotenv.config();
const BUCKET_NAME = process.env.BUCKET_NAME;
const BUCKET_REGION = process.env.BUCKET_REGION;
//s3
const s3_client = new S3Client({
  region: BUCKET_REGION,
  // --- delete this ----

  // --- delete this ----
});

//dynamo
const client = new dynamodb.DynamoDBClient({
  region: 'us-east-1',
  // --- delete this ----

  // --- delete this ----
});
const ddbDocClient = new DynamoDBDocumentClient(client);

async function addNewProduct(req) {
  const productId = generateId();
  //upload image to s3
  const image_extension = req.file.originalname.split('.').pop();
  const cmd_s3 = new PutObjectCommand_s3({
    Bucket: BUCKET_NAME,
    Key: productId + '.' + image_extension,
    Body: req.file.buffer,
    ContentType: req.file.mimetype,
  });
  await s3_client.send(cmd_s3);

  //update dynamoDB
  const cmd = new PutCommand({
    Item: {
      Id: productId,
      Title: req.body.title,
      User: req.body.user,
      Description: req.body.description,
    },
    TableName: 'Products',
  });
  await ddbDocClient.send(cmd);
}

async function getProducts() {
  // scan Products table
  const cmd1 = new ScanCommand({
    TableName: 'Products',
  });
  const response1 = await ddbDocClient.send(cmd1);
  const items = response1.Items;

  // scan ProductImages table
  const cmd2 = new ScanCommand({
    TableName: 'ProductImages',
  });
  const response2 = await ddbDocClient.send(cmd2);
  const images = response2.Items;

  return items.map((item) => {
    const foundImage = images.find((image) => image.ProductId === item.Id);
    return {
      title: item.Title,
      user: item.User,
      id: item.Id,
      description: item.Description,
      imageURI: foundImage ? foundImage.ImageURI : '',
    };
  });
}

// function addNewComment(productId, commentData) {
//   const cmd = new PutCommand({
//     Item: {
//       Id: generateId(),
//       ProductId: productId,
//       CreationDate: new Date().toISOString(),
//       Title: commentData.title,
//       User: commentData.user,
//       Text: commentData.text,
//     },
//     TableName: 'Comments',
//   });
//   return ddbDocClient.send(cmd);
// }

async function getProduct(productId) {
  const cmd = new GetCommand({
    Key: {
      Id: productId,
    },
    TableName: 'Products',
  });

  const response = await ddbDocClient.send(cmd);
  const productData = response.Item;

  const cmd2 = new QueryCommand({
    KeyConditions: {
      ProductId: {
        AttributeValueList: [productId],
        ComparisonOperator: 'EQ',
      },
    },
    TableName: 'Comments',
  });

  const response2 = await ddbDocClient.send(cmd2);
  const comments = response2.Items;

  const product = {
    id: productData.Id,
    title: productData.Title,
    description: productData.Description,
    user: productData.User,
    comments: comments.map((comment) => ({
      id: comment.Id,
      productId: comment.ProductId,
      title: comment.Title,
      user: comment.User,
      text: comment.Text,
    })),
  };

  return product;
}

exports.addNewProduct = addNewProduct;
//exports.addNewComment = addNewComment;
exports.getProducts = getProducts;
exports.getProduct = getProduct;
