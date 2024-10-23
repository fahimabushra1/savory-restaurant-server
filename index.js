const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId} = require('mongodb');

// middleware:
app.use(cors());
app.use(express.json());

const uri = process.env.DB_URL;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {

    await client.connect();
    const menuCollection = client.db("savvoryDB").collection("menu");
    const reviewCollection = client.db("savvoryDB").collection("reviews");
    const userCollection = client.db("savvoryDB").collection("users");
    const cartsCollection = client.db("savvoryDB").collection("carts");

        // jwt related api
    app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
      res.send({ token });
    })

    // middlewares 
    const verifyToken = (req, res, next) => {
      console.log('inside verify token', req.headers.authorization);
      if (!req.headers.authorization) {
        return res.status(401).send({ message: 'unauthorized access' });
      }
      const token = req.headers.authorization.split(' ')[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: 'unauthorized access' })
        }
        req.decoded = decoded;
        next();
      })
    }

    // use verify admin after verifyToken
    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      const isAdmin = user?.role === 'admin';
      if (!isAdmin) {
        return res.status(403).send({ message: 'forbidden access' });
      }
      next();
    }


    app.post('/menu', async (req,res)=>{
      const menuData = req.body;
      const result = await menuCollection.insertOne(menuData);
      res.send(result)
  })

  app.get('/menu', async (req,res)=>{
    const result = await menuCollection.find().toArray();
    res.send(result);
  })
    app.post('/reviews', async (req,res)=>{
      const reviewData = req.body;
      const result = await reviewCollection.insertOne(reviewData);
      res.send(result)
  })

  app.get('/reviews', async (req,res)=>{
    const reviewData = reviewCollection.find();
    const result = await reviewData.toArray();
    res.send(result);
  })

  app.delete('/menu/:id',async (req,res)=>{
    const id = req.params.id;
    const result = menuCollection.deleteOne({_id:new ObjectId(id)});
    res.send(result);
  })

 app.post('/users', async(req,res)=>{
  const user = req.body;
  const token = createToken(user);
  console.log(token)
  const isUserExist = await userCollection.findOne({email: user?.email})
  console.log(isUserExist)
  if(isUserExist?._id){
    return res.send({
      status:"success",
      message:"login success",
      token
    })
  }
  await userCollection.insertOne(user);
  res.send(token)
 })


 app.get('/users', async (req,res)=>{
  const userData = userCollection.find();
  const result = await userData.toArray();
  res.send(result);
})


 app.get('/users/get/:id', async (req,res)=>{
  const id = req.params.id;
  const result = await userCollection.findOne({_id:new ObjectId(id)});
  res.send(result);
 })

 app.get('/users/:email', async (req,res)=>{
  const email = req.params.email;
  const result = await userCollection.findOne({email});
  res.send(result);
 })

 app.patch('/users/:email', async (req,res)=>{
  const email = req.params.email;
  const userData = req.body;
  const result = await userCollection.updateOne({email},{$set: userData},{upsert:true});
  res.send(result);
 })

//  carts collection

 app.post('/carts', async (req,res)=>{
  const cartData = req.body;
  const result = await cartsCollection.insertOne(cartData);
  res.send(result)
})

app.get('/carts', async (req,res)=>{
  const email = req.query.email;
  console.log(email)
  const query = {email: email}
  const result = await cartsCollection.find(query).toArray();
  console.log(result)
  res.send(result);
})

app.delete('/carts/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await cartsCollection.deleteOne(query);
      res.send(result);
    })
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res)=>{
    res.send("savory restaurant server is running")
})


app.listen(port,() => {
    console.log(`savory restaurant server running on port ${port}`);
})
