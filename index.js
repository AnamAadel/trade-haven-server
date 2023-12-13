const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
var cookieParser = require('cookie-parser')
require("dotenv").config()

// const user = []

const app = express();
const port = process.env.PORT || 5000;

app.use(cookieParser())
app.use(cors())
app.use(express.json());

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




const db = client.db("myShopDB");
const productCollection = db.collection("products");
const usersCollection = db.collection("users");
const blogCollection = db.collection("blogs");
const cartCollection = db.collection("cartItem");
const bookedProductCollection = db.collection("bookedProducts");


// Create a MongoClient with a MongoClientOptions object to set the Stable API version



const verifyToken = (req, res, next) => {
  const token = req.cookies.accessToken;
  console.log()

  if (!token) {
    return res.status(401).send({ error: "not authorized!" });
  } else {
    jwt.verify(token, "secret", (err, decoded) => {
      if (err) {
        return res.status(401).send({ error: "unauthorized" })
      }
      console.log(decoded.email);
      console.log(req.query.email);

      if (decoded.email === req.query.email) {
        req.user = decoded;
        next();

      } else {
        return res.status(403).send({ error: "forbidden!" })
      }
    })
  }
}


app.get("/", async (req, res) => {
  
  res.send("server is running");
})


// =================products ===================
// create api to get all product data

app.get("/products/brands", async (req, res) => {
  const cursor = productCollection.aggregate([{ $project: { "brand": 1, "_id": 1 } }]);
  const categories = await cursor.toArray();
  // console.log(categories)
  res.send(categories);
})


// create api to get all product data

app.get("/products/types", async (req, res) => {
  const cursor = productCollection.aggregate([{ $project: { "type": 1, "_id": 1 } }]);
  const categories = await cursor.toArray();
  // console.log(categories)
  res.send(categories);
})
// create api to add cart Data



// create api to get all product data

app.post("/products_review/:id", async (req, res) => {
  const id = req.params.id;
  const filter = { _id: new ObjectId(id) };

  const existingDoc = await productCollection.findOne(filter);

  const option = { upsert: true };

  if(existingDoc.reviews){
    // if they already have reviews field 
    const updateDoc = {
      $push: {
        "reviews": req.body
      }
    }
    const result = await productCollection.updateOne(filter, updateDoc, option);
    res.status(200).send(result);
    
  }else{
    // if they not have reviews field  
    let updateDoc = {
      $set: {
        "reviews": []
      }
    }
    const output = await productCollection.updateOne(filter, updateDoc, option);
    
    updateDoc = {
      $push: {
        "reviews": req.body
      }
    }
    const result = await productCollection.updateOne(filter, updateDoc, option);
    res.status(200).send(result);
  }
})


app.put("/review_reply/:id", async (req, res) => {
  const id = req.params.id;
  const filter = { _id: new ObjectId(id), "reviews.id": req.body?.id };
  const option = { upsert: true };

  const existingDoc = await productCollection.findOne(filter);

  if(existingDoc?.review?.replies){
    const updateDoc = {
      $push: {
        "reviews.$.replies": req.body
      }
    }
    const result = await productCollection.updateOne(filter, updateDoc, option);
    res.status(200).send(result);
    
  }else{
    // create field
    let updateDoc = {
      $set: {
        "reviews.$.replies": [],
      }
    }
    const output = await productCollection.updateOne(filter, updateDoc, option);


    updateDoc = {
      $push: {
        "reviews.$.replies": req.body,
      }
    }
    const result = await productCollection.updateOne(filter, updateDoc, option);


    res.status(200).send(result);

  }
})

// created api to get product data by id
app.get("/products/:id", async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) }
  const product = await productCollection.findOne(query);
  // const userData = await cursor.toArray();
  console.log(id)
  res.send(product);

})

// created api to get related product data
app.get("/related_products/:type", async (req, res) => {
  const type = req.params.type;
  const query = { type: type }
  console.log(query)
  const products = await productCollection.find(query).toArray();
  
  res.send(products);

})


// created api to get product data by id
app.get("/products", async (req, res) => {
  const limit = parseInt(req.query?.limit ? req.query?.limit : null);
  const skip = parseInt(req.query?.skip ? req.query?.skip : null);
  const productSort = req.query?.productSort ? req.query?.productSort : null;
  const price = parseInt(req.query?.priceRange ? req.query?.priceRange : null);
  const category = req.query?.category ? req.query?.category.split(",") : null; 
  const brand = req.query?.brand ? req.query?.brand.split(",") : req.query?.brand;
  const search = req.query?.search ? req.query?.search : null;

  console.log("isSearch", search !== "undefined")
  console.log("search", search)
  // if(search !== undefined && search !== ""){
  //   console.log("inside search",search)
  //   const searchProducts = await productCollection.find({name: search}).toArray();
  //   return res.status(200).send(searchProducts)
  // }

  const priceRange = price > 0 || price !== undefined ? price : null;
  console.log("priceRange:", priceRange)
  let filter = {};

  if (category?.length > 0 && category[0] !== "" && brand?.length > 0 && brand[0] !== "") {
    if (priceRange) {
      filter = {
        type: {
          $in: category
        }, brand: {
          $in: brand
        }, price: {
          $lt: priceRange
        }
      }

    } else {
      filter = {
        type: {
          $in: category
        }, brand: {
          $in: brand
        }
      }

    }
  } else if (category?.length > 0 && category[0] !== "") {
    if (priceRange) {
      filter = {
        type: {
          $in: category
        },
        price: {
          $lt: priceRange
        }
      }

    } else {
      filter = {
        type: {
          $in: category
        }
      }
    }
  } else if (brand?.length > 0 && brand[0] !== "") {
    if (priceRange) {
      filter = {
        brand: {
          $in: brand
        }, price: {
          $lt: priceRange
        }
      }

    } else {
      filter = {
        brand: {
          $in: brand
        }
      }
    }
  } else {
    filter = {}
  }


  const isSplicing = typeof limit === "number" && typeof skip === "number";

  // if user limit and skip value pass, product send according this
  if (isSplicing && !productSort) {
    const spliceProduct = await productCollection.find(filter).limit(limit).skip(skip).toArray();
    res.send(spliceProduct);

  } else if (isSplicing && productSort) {
    // if user limit , skip and productSort value pass, product send according this

    switch (productSort) {
      case "AtoZ":
        const spliceAnd_AtoZ_Product = await productCollection.find(filter).limit(limit).skip(skip).sort({ name: 1 }).toArray();
        res.send(spliceAnd_AtoZ_Product);
        break;


      case "ZtoA":
        const spliceAnd_ZtoA_Product = await productCollection.find(filter).limit(limit).skip(skip).sort({ name: -1 }).toArray();
        res.send(spliceAnd_ZtoA_Product);

        break;
      case "ascending":
        const spliceAnd_ascending_Product = await productCollection.find(filter).limit(limit).skip(skip).sort({ price: 1 }).toArray();
        res.send(spliceAnd_ascending_Product);


        break;
      case "descending":
        const spliceAnd_descending_Product = await productCollection.find(filter).limit(limit).skip(skip).sort({ price: -1 }).toArray();
        res.send(spliceAnd_descending_Product);
        break;
      default:
        const products = await productCollection.find(filter).toArray();
        res.send(products);
        break;
    }


  } else if (typeof limit === "number" && productSort) {
    switch (productSort) {
      case "AtoZ":
        const spliceAnd_AtoZ_Product = await productCollection.find(filter).limit(limit).sort({ name: 1 }).toArray();
        res.send(spliceAnd_AtoZ_Product);
        break;


      case "ZtoA":
        const spliceAnd_ZtoA_Product = await productCollection.find(filter).limit(limit).sort({ name: -1 }).toArray();
        res.send(spliceAnd_ZtoA_Product);

        break;
      case "ascending":
        const spliceAnd_ascending_Product = await productCollection.find(filter).limit(limit).sort({ price: 1 }).toArray();
        res.send(spliceAnd_ascending_Product);


        break;
      case "descending":
        const spliceAnd_descending_Product = await productCollection.find(filter).limit(limit).sort({ price: -1 }).toArray();
        res.send(spliceAnd_descending_Product);
        break;
      default:
        const products = await productCollection.find(filter).toArray();
        res.send(products);
        break;
    }
  } else if (typeof limit === "number") {
    const spliceProduct = await productCollection.find(filter).limit(limit).toArray();
    res.send(spliceProduct);
  } else {
    // if user limit and skip value did not pass, then send all products

    const products = await productCollection.find(filter).toArray();
    res.send(products);
  }
})

// ========================= blog =========================
// create api to get all product data

app.get("/blogs", async (req, res) => {
  const cursor = blogCollection.find();
  const blogs = await cursor.toArray();
  res.send(blogs);
})

// created api to get blog data by id
app.get("/blogs/:id", async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) }
  const blog = await blogCollection.findOne(query);
  // const userData = await cursor.toArray();
  res.send(blog);
})
// create api to get all product data

app.post("/blog_comments/:id", async (req, res) => {
  const id = req.params.id;
  const filter = { _id: new ObjectId(id) };

  const existingDoc = await blogCollection.findOne(filter);

  const option = { upsert: true };

  if(existingDoc.comments){
    // if they already have reviews field 
    const updateDoc = {
      $push: {
        "comments": req.body
      }
    }
    const result = await blogCollection.updateOne(filter, updateDoc, option);
    res.status(200).send(result);
    
  }else{
    // if they not have reviews field  
    let updateDoc = {
      $set: {
        "comments": []
      }
    }
    const output = await blogCollection.updateOne(filter, updateDoc, option);
    
    updateDoc = {
      $push: {
        "comments": req.body
      }
    }
    const result = await blogCollection.updateOne(filter, updateDoc, option);
    res.status(200).send(result);
  }
})


app.put("/blog_reply/:id", async (req, res) => {
  const id = req.params.id;
  const filter = { _id: new ObjectId(id), "comments.id": req.body?.id };
  const option = { upsert: true };

  const existingDoc = await blogCollection.findOne(filter);

  if(existingDoc?.comments?.replies){
    const updateDoc = {
      $push: {
        "comments.$.replies": req.body
      }
    }
    const result = await blogCollection.updateOne(filter, updateDoc, option);
    res.status(200).send(result);
    
  }else{
    // create field
    let updateDoc = {
      $set: {
        "comments.$.replies": [],
      }
    }
    const output = await blogCollection.updateOne(filter, updateDoc, option);


    updateDoc = {
      $push: {
        "comments.$.replies": req.body,
      }
    }
    const result = await blogCollection.updateOne(filter, updateDoc, option);


    res.status(200).send(result);

  }
})


// ==========================cart=====================
app.post("/cart", async (req, res) => {
  const id = req.query?.body._id;
  const filter = { _id: new ObjectId(id) };

  const existDoc = await cartCollection.find();
  if (!existDoc) {
    const result = await cartCollection.insertOne(req.body);
    res.send(result); 
  } else {
    const option = { upsert: true };
    const updateDoc = {
      $set: req.body
    }
    const result = await cartCollection.updateOne(filter, updateDoc, option);
    res.status.send(result);
  }
})
// create api to get all product data

app.put("/cart/:id", async (req, res) => {
  const id = req.query.id;
  const filter = { _id: new ObjectId(id) };
  const option = { upsert: true };
  const updateDoc = {
    $set: req.body
  }
  const result = await productCollection.updateOne(filter, updateDoc, option);
  res.send(result);
})

// create api to get all product data

app.get("/cartProduct", async (req, res) => {
  const cursor = cartCollection.find();
  const cartProduct = await cursor.toArray();
  res.send(cartProduct);
})

// create api to get selling points  data

app.get("/selling_points", async (req, res) => {
  const cursor = sellingPointsCollection.find();
  const productData = await cursor.toArray();
  res.send(productData);
})


// create api to get selling points  data

app.get("/our_teams", async (req, res) => {
  const cursor = ourTeamsCollection.find();
  const productData = await cursor.toArray();
  res.send(productData);
})

// create api to get limited data
app.get("/services", async (req, res) => {
  const limit = parseInt(req.query.limit);
  console.log("limit")
  const cursor = serviceCollection.find().limit(limit);
  const serviceData = await cursor.toArray();
  res.send(serviceData);
})

// create api to get data by search
app.post("/services", async (req, res) => {
  const search = req.body.search;
  console.log("search")
  const cursor = serviceCollection.find({ $or: [{ serviceName: search }, { category: search }] });
  const serviceData = await cursor.toArray();
  res.send(serviceData);
})

// create api to get all category

app.get("/services/categories", async (req, res) => {
  const cursor = serviceCollection.find();
  const productData = await cursor.toArray();
  const categories = productData.map((item) => item.category);
  const uniqCategories = [...new Set(categories)]
  // console.log(productData)
  res.send(uniqCategories);
})

// created api to get my service data
app.get("/my_services", async (req, res) => {
  const query = req.query.email
  const cursor = serviceCollection.find({ providerEmail: query });
  const myServices = await cursor.toArray();
  console.log(query)
  res.send(myServices);
})




// created api to update service data by id
app.get("/service_update/:id", async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) }
  const userData = await serviceCollection.findOne(query);
  res.send(userData);
})

// created api to get product data by category
app.get("/services/type/:id", async (req, res) => {
  const type = req.params.id;
  console.log(type);
  const query = { category: type }
  const serviceData = await serviceCollection.find(query).toArray();
  console.log(serviceData)
  res.send(serviceData);
})



// created api to add products
app.post("/service_add", async (req, res) => {
  console.log(req.body)

  const productData = req.body;

  const result = await serviceCollection.insertOne(productData);
  console.log(result);


  res.send(result);
})


// created api to add products
app.get("/my_bookings", async (req, res) => {
  const query = req.query.email
  console.log(query)
  const cursor = bookedServiceCollection.find({ userEmail: query });
  const myServices = await cursor.toArray();
  res.send(myServices);
})


// created api to add products
app.get("/provider_service", async (req, res) => {
  const query = req.query.email
  console.log(query)
  const cursor = serviceCollection.find({ "serviceProvider.providerEmail": query });
  const myServices = await cursor.toArray();
  res.send(myServices);
})


// created api to add products
app.get("/pending_work", async (req, res) => {
  const query = req.query.email
  const cursor = bookedServiceCollection.find({ providerEmail: query });
  const myServices = await cursor.toArray();
  console.log(query)
  res.send(myServices);
})


// created api to add products
app.put("/pending_work/:id", async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const data = req.body;
  delete data._id
  const updatedData = {
    $set: data,
  };

  console.log(data)

  const options = { upsert: true }

  const result = await bookedServiceCollection.updateOne(query, updatedData, options);

  console.log(result);
  res.send(result)
})

app.delete("/pending_work/delete/:id", async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const result = await bookedServiceCollection.deleteOne(query);
  // const userData = await cursor.toArray();

  res.send(result)

})


app.delete("/my_services/delete/:id", async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const result = await serviceCollection.deleteOne(query);
  // const userData = await cursor.toArray();

  res.send(result)

})


// created api to add products
app.post("/book_service", async (req, res) => {
  console.log(req.body)

  const productData = req.body;

  const result = await bookedServiceCollection.insertOne(productData);
  console.log(result);


  res.send(result);
})

// created api to update product data by id
app.put("/service_update/:id", async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };

  const updatedData = {
    $set: req.body,
  };

  console.log(updatedData)

  const options = { upsert: true }

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
app.post("/add_user", async (req, res) => {
  console.log(req.body)

  const cursor = usersCollection.find();
  const allUsers = await cursor.toArray();

  const userData = req.body;
  const userIndex = allUsers.findIndex((item) => item.email === userData.email);
  console.log(userData)

  if (userIndex >= 0) {

    const token = jwt.sign(userData, "secret", { expiresIn: "1h" })

    // console.log(token);

    res.cookie("accessToken", token, {
      httpOnly: true,
      secure: false,
      sameSite: false
    })

    res.status(200).send({ msg: "user Login successfully!" })

  } else {
    const result = await usersCollection.insertOne(userData);


    const token = jwt.sign(userData, "secret", { expiresIn: "1h" })

    // console.log(token);

    res.cookie("accessToken", token, {
      httpOnly: true,
      secure: false,
      sameSite: false
    })

    res.send(result);

  }

})


app.delete("/logout", async (req, res) => {
  const token = req.cookies.accessToken;

  console.log(token);
  console.log("accessToken");

  res.clearCookie("accessToken");

})

app.delete("/users/delete/:id", async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const userData = await usersCollection.findOne(query);
  // const userData = await cursor.toArray();

  const productId = req.body.productId;

  const filterProducts = userData.products.filter((item) => item._id !== productId);
  console.log(productId);
  console.log(productId);

  const updatedData = {
    $set: { products: filterProducts },
  };
  const options = { upsert: true }

  const result = await usersCollection.updateOne(query, updatedData, options);

  res.send(result)

})

app.listen(port, () => {
  console.log(`server listening on ${port}`)
})
