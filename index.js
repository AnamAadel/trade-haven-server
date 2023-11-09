const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express  = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
var cookieParser = require('cookie-parser')
require("dotenv").config()

// const user = []

const app = express();
const port = process.env.PORT || 5000;

app.use(cookieParser())

const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.USER_PASS}@cluster0.otazdf5.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

    

    
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);




const db = client.db("serviceDB");
const serviceCollection = db.collection("services");
const usersCollection = db.collection("users");
const addedServiceCollection = db.collection("userService");
const sellingPointsCollection = db.collection("sellingPoints");
const bookedServiceCollection = db.collection("bookedServices");
const ourTeamsCollection = db.collection("ourTeams");


// Create a MongoClient with a MongoClientOptions object to set the Stable API version






app.use(cors({
  origin: ["http://localhost:5173" , "https://assignment-11-cqrc.vercel.app", "https://assignment-11-cqrc-git-master-aadelbanat8991-gmailcom.vercel.app", "https://back-end-vercel-fe6ss6icx-aadelbanat8991-gmailcom.vercel.app/"],
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true
}))
app.use(express.json());


const verifyToken = (req, res, next)=> {
  const token = req.cookies.accessToken;
  console.log()

  if(!token){
    return res.status(401).send({error: "not authorized!"});
  }else{
    jwt.verify(token, "secret", (err, decoded)=> {
      if(err){
        return res.status(401).send({error: "unauthorized"})
      }
      console.log(decoded.email);
      console.log(req.query.email);

      if(decoded.email === req.query.email){
        req.user = decoded;
        next();

      }else{
        return res.status(403).send({error: "forbidden!"})
      }
    })
  }
}

// create api to get all data

app.get("/services/all", async (req, res)=> {
    const cursor = serviceCollection.find();
    const productData = await cursor.toArray();
    res.send(productData);
})


// create api to get selling points  data

app.get("/selling_points", async (req, res)=> {
    const cursor = sellingPointsCollection.find();
    const productData = await cursor.toArray();
    res.send(productData);
})


// create api to get selling points  data

app.get("/our_teams", async (req, res)=> {
    const cursor = ourTeamsCollection.find();
    const productData = await cursor.toArray();
    res.send(productData);
})

// create api to get limited data
app.get("/services", async (req, res)=> {
  const limit = parseInt(req.query.limit);
  console.log("limit")
    const cursor = serviceCollection.find().limit(limit);
    const serviceData = await cursor.toArray();
    res.send(serviceData);
})

// create api to get data by search
app.post("/services",  async (req, res)=> {
  const search = req.body.search;
  console.log("search")
    const cursor = serviceCollection.find({$or: [{serviceName: search}, {category: search}]});
    const serviceData = await cursor.toArray();
    res.send(serviceData);
})

// create api to get all category

app.get("/services/categories" , async (req, res)=> {
    const cursor = serviceCollection.find();
    const productData = await cursor.toArray();
    const categories = productData.map((item)=> item.category);
    const uniqCategories = [...new Set(categories)] 
    // console.log(productData)
    res.send(uniqCategories);
})

// created api to get my service data
app.get("/my_services" , async (req, res)=> {
    const query = req.query.email
    const cursor = serviceCollection.find({providerEmail: query});
    const myServices = await cursor.toArray();
    console.log(query)
    res.send(myServices);
})

// created api to get product data by id
app.get("/service/:id" , async (req, res)=> {
  const id = req.params.id;
  const query = {_id: new ObjectId(id)}
  const userData = await serviceCollection.findOne(query);
    // const userData = await cursor.toArray();
    res.send(userData);
})


// created api to update service data by id
app.get("/service_update/:id" , async (req, res)=> {
  const id = req.params.id;
  const query = {_id: new ObjectId(id)}
  const userData = await serviceCollection.findOne(query);
    res.send(userData);
})

// created api to get product data by category
app.get("/services/type/:id" , async (req, res)=> {
  const type = req.params.id;
  console.log(type);
  const query = {category: type}
  const serviceData = await serviceCollection.find(query).toArray();
    console.log(serviceData)
    res.send(serviceData);
})



// created api to add products
app.post("/service_add"  , async (req, res)=> {
    console.log(req.body)

    const productData = req.body;

    const result = await serviceCollection.insertOne(productData);
    console.log(result);
    
    
    res.send(result);
})


// created api to add products
app.get("/my_bookings"  , async (req, res)=> {
  const query = req.query.email
  console.log(query)
  const cursor = bookedServiceCollection.find({userEmail: query});
  const myServices = await cursor.toArray();
  res.send(myServices);
})


// created api to add products
app.get("/provider_service" , async (req, res)=> {
  const query = req.query.email
  console.log(query)
  const cursor = serviceCollection.find({"serviceProvider.providerEmail" :query});
  const myServices = await cursor.toArray();
  res.send(myServices);
})


// created api to add products
app.get("/pending_work"  , async (req, res)=> {
  const query = req.query.email
  const cursor = bookedServiceCollection.find({providerEmail: query});
  const myServices = await cursor.toArray();
  console.log(query)
  res.send(myServices);
})


// created api to add products
app.put("/pending_work/:id"  , async (req, res)=> {
  const id = req.params.id;
    const query = {_id: new ObjectId(id)};
    const data = req.body;
    delete data._id
    const updatedData = {
      $set: data,
    };

    console.log(data)

    const options = {upsert: true}

    const result = await bookedServiceCollection.updateOne(query, updatedData, options);

    console.log(result);
    res.send(result)
})

app.delete("/pending_work/delete/:id" , async (req, res)=> {
  const id = req.params.id;
    const query = {_id: new ObjectId(id)};
    const result = await bookedServiceCollection.deleteOne(query);
  // const userData = await cursor.toArray();

  res.send(result)

})


app.delete("/my_services/delete/:id" , async (req, res)=> {
  const id = req.params.id;
    const query = {_id: new ObjectId(id)};
    const result = await serviceCollection.deleteOne(query);
  // const userData = await cursor.toArray();

  res.send(result)

})


// created api to add products
app.post("/book_service" , async (req, res)=> {
    console.log(req.body)

    const productData = req.body;

    const result = await bookedServiceCollection.insertOne(productData);
    console.log(result);
    
    
    res.send(result);
})

// created api to update product data by id
app.put("/service_update/:id" , async (req, res)=> {
    const id = req.params.id;
    const query = {_id: new ObjectId(id)};

    const updatedData = {
      $set: req.body,
    };

    console.log(updatedData)

    const options = {upsert: true}

    const result = await serviceCollection.updateOne(query, updatedData, options);

    console.log(result);
    res.send(result)
})

// created api to add user
// app.post("/add_user", async (req, res)=> {
//     console.log(req.body)

//     const cursor = usersCollection.find();
//     const allUsers = await cursor.toArray();
    
//     const productData = req.body;
//     const userIndex = allUsers.findIndex((item)=> item.email === productData.email);

//     if(userIndex >= 0){
      
//       res.status(200).send({message: "user login successfully"});
      
//     }else{
//       const result = await usersCollection.insertOne(productData);
//       console.log(result);
      
//       res.send(result);

//     }

// })

// created api to add user
app.post("/add_user", async (req, res)=> {
  console.log(req.body)

  const cursor = usersCollection.find();
  const allUsers = await cursor.toArray();
  
  const userData = req.body;
  const userIndex = allUsers.findIndex((item)=> item.email === userData.email);
  console.log(userData)

  if(userIndex >= 0){

    const token = jwt.sign(userData, "secret", {expiresIn: "1h"})
    
    // console.log(token);

    res.cookie("accessToken",token, {
      httpOnly: true,
      secure: false,
      sameSite: false
    })

    res.status(200).send({msg: "user Login successfully!"})
    
  }else{
    const result = await usersCollection.insertOne(userData);
    

    const token = jwt.sign(userData, "secret", {expiresIn: "1h"})
    
    // console.log(token);

    res.cookie("accessToken",token, {
      httpOnly: true,
      secure: false,
      sameSite: false
    })
    
    res.send(result);

  }

})


app.delete("/logout", async (req, res)=> {
  const token = req.cookies.accessToken;

  console.log(token);
  console.log("accessToken");

  res.clearCookie("accessToken");

})

app.delete("/users/delete/:id", async (req, res)=> {
  const id = req.params.id;
    const query = {_id: new ObjectId(id)};
    const userData = await usersCollection.findOne(query);
  // const userData = await cursor.toArray();

  const productId = req.body.productId;

  const filterProducts = userData.products.filter((item)=> item._id !== productId);
  console.log(productId);
  console.log(productId);
  
  const updatedData = {
    $set: {products: filterProducts},
  };
  const options = {upsert: true}

  const result = await usersCollection.updateOne(query, updatedData, options);

  res.send(result)

})

app.listen(port, () => {
    console.log(`server listening on ${port}`)
})
