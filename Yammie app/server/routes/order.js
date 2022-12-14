const express = require("express")
const app = express()
const bodyParser = require('body-parser')
const fs = require('fs')
const {v4 : uuidv4} = require('uuid')
const Ajv = require("ajv")
const ajv = new Ajv({allErrors: true}) 
const {getDate, getTime, getOrderData, saveOrderData, jsonSchema} = require('../helperfunc');
const cors = require("cors");
app.use(cors());

// configure our express instance with some body-parser settings including handling JSON data
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }));

const validate = ajv.compile(jsonSchema)

/********** CRUD Operations ***********/

// Create - add new order to the json file
app.post('/order', (req, res) => { 
  // validate order data
  const valid = validate(req.body)
  if(!valid) // order data is not valid
    res.status(400).send(validate.errors) 
  else{ // order data is valid 
    let orders = getOrderData()
    // create new order with new order id
    const newOrderId = uuidv4()
    orders[newOrderId] = req.body
    // add current date
    const date = getDate()
    orders[newOrderId]["date"] = date
    // add current time
    const time = getTime()
    orders[newOrderId]["time"] = time
    // add order to the database
    saveOrderData(orders);
    res.status(200).send({msg: "Your order is on the way", orderID : `${newOrderId}`})
  }
})

// Read - get order with specific id
app.get('/order/:id', (req, res) => {
  const orders = getOrderData()
  const orderId = req.params['id'];
  if(orders.hasOwnProperty(orderId)) // order is found
    res.status(200).send(orders[orderId])
  else // order not found
    res.status(404).send(`order with id ${orderId} is not exist`)

})

// Read - get all orders
app.get('/order', (req, res) => {
  const orders = getOrderData()
  if(Object.keys(orders).length === 0)
    res.status(404).send("no orders found")
  else
    res.status(200).send(orders)
})

// Read - get all orders from the last day
app.get('/order/filter/lastday', (req, res) => {
  const orders = getOrderData()
  // object that store all orders from the last day
  let lastDayOrders = {}
  const currDate = getDate()
  for(const id in orders){
    if(orders[id]["date"] === currDate)  
      lastDayOrders[id] = orders[id]
  }
  if(Object.keys(lastDayOrders).length === 0)
    res.status(404).send("no orders found")
  else
    res.status(200).send(lastDayOrders)
})

// Update - update order with specific id
app.put('/order/:id', (req, res) => {
  let orders = getOrderData()
  const orderId = req.params['id'];
  if(orders.hasOwnProperty(orderId)){ // order is found in database
    const valid = validate(req.body)
    if(!valid) // order data is not
      res.status(400).send(validate.errors) 
    else{ // order data is valid 
      orders[orderId] = req.body;
      // update current date
      const date = getDate()
      orders[orderId]["date"] = date
      // update current time
      const time = getTime()
      orders[orderId]["time"] = time
      saveOrderData(orders);
      res.status(200).send(`order with id ${orderId} has been updated`)
    }
  }
  else // order not found
    res.status(404).send(`order with id ${orderId} is not exist`)
  });

// Delete - delete order with specific id
app.delete('/order/:id', (req, res) => {
  let orders = getOrderData()
  const orderId = req.params['id'];
  if(orders.hasOwnProperty(orderId)){ // order is found in database
    delete orders[orderId];  
    saveOrderData(orders);
    res.status(200).send(`order with id ${orderId} has been deleted`)
  }
  else // order not found
    res.status(404).send(`order with id ${orderId} is not exist`)
});

module.exports = app
