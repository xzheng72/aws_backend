const { v4: generateId } = require('uuid');
const dynamodb = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  ScanCommand,
  QueryCommand,
} = require('@aws-sdk/lib-dynamodb');

const client = new dynamodb.DynamoDBClient({
  region: 'us-east-1',
  // --- delete this ----

  // --- delete this ----
});
const ddbDocClient = new DynamoDBDocumentClient(client);

function addNewProduct(productData) {
  const cmd = new PutCommand({
    Item: {
      Id: generateId(),
      Title: productData.title,
      User: productData.user,
      Description: productData.description,
    },
    TableName: 'Products',
  });
  return ddbDocClient.send(cmd);
}

async function getProducts() {
  const cmd = new ScanCommand({
    TableName: 'Products',
  });

  const response = await ddbDocClient.send(cmd);
  const items = response.Items;

  return items.map((item) => ({
    title: item.Title,
    user: item.User,
    id: item.Id,
    description: item.Description,
  }));
}

function addNewComment(productId, commentData) {
  const cmd = new PutCommand({
    Item: {
      Id: generateId(),
      ProductId: productId,
      CreationDate: new Date().toISOString(),
      Title: commentData.title,
      User: commentData.user,
      Text: commentData.text,
    },
    TableName: 'Comments',
  });
  return ddbDocClient.send(cmd);
}

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
exports.addNewComment = addNewComment;
exports.getProducts = getProducts;
exports.getProduct = getProduct;
