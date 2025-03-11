const express = require("express");
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken')
app.use(cors());
app.use(express.json());
require('dotenv').config()
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

const port = process.env.PORT || 5000;



// app.use(cors({
//       origin: "http://localhost:5173", // React app এর origin
//       methods: ["GET", "POST", "PUT", "DELETE"],
//       credentials: true
//     }));


// app.use(
//       cors({
//         origin: [
//           "http://localhost:5173",
//           "http://localhost:5000",
//         ],
//         credentials: true,
//       })
//     );
//     app.use(express.json());




// Mongobd Connect Start
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.sozmemk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
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

            const menuCollection = client.db('Bistroboss').collection('menu')
            const reviewsCollection = client.db('Bistroboss').collection('reviews')
            const cartsCollection = client.db('Bistroboss').collection('carts')
            const userCollection = client.db('Bistroboss').collection('users')
            const paymentsCollection = client.db('Bistroboss').collection('payments')

            // jwt Related Data
            app.post('/jwt', async (req, res) => {
                  const user = req.body;
                  const token = jwt.sign(user, process.env.ACCESSS_TOKEN_SECRET, { expiresIn: '1hr' })
                  res.send({ token })
            })

            // MiddleWare
            const verifyToken = (req, res, next) => {
                  console.log('Insite ferify token', req.headers.authorization)
                  if (!req.headers.authorization) {
                        return res.status(401).send({ message: 'unauthorized access' })
                  }
                  const token = req.headers.authorization.split(' ')[1];
                  jwt.verify(token, process.env.ACCESSS_TOKEN_SECRET, (err, decoded) => {
                        if (err) {
                              return res.status(401).send({ message: 'unauthorized access' })
                        }
                        req.decoded = decoded
                        next()
                  })
            }
            // Verify Admin
            const verifyAdmin = async (req, res, next) => {
                  const email = req.decoded.email
                  const query = { email: email };
                  const user = await userCollection.findOne(query);
                  const isAdmin = user?.role === 'admin';
                  if (!isAdmin) {
                        return res.status(403).send({ message: 'forbidden asccess' });
                  }
                  next()

            }

            // Menu Item
            app.get("/menu", async (req, res) => {
                  const result = await menuCollection.find().toArray()
                  res.send(result)
            })

            app.post('/menu', verifyToken, verifyAdmin, async (req, res) => {
                  const cartItem = req.body;
                  const result = await menuCollection.insertOne(cartItem)
                  res.send(result)
            })

            app.delete('/menu/:id', verifyToken, verifyAdmin, async (req, res) => {
                  const id = req.params.id;
                  console.log("Received id delete:", id);
                  const query = { _id: new ObjectId(id) };
                  const result = await menuCollection.deleteOne(query);
                  res.send(result);
            });

            app.patch("/menu/:id", verifyToken, verifyAdmin, async (req, res) => {
                  const item = req.body;
                  const id = req.params.id;
                  const filter = { _id: new ObjectId(id) };
                  const updatedDoc = {
                        $set: {
                              name: item.name,
                              category: item.category,
                              price: item.price,
                              recipe: item.recipe,
                              image: item.image,
                        },
                  };
                  const result = await menuCollection.updateOne(filter, updatedDoc);
                  res.send(result);
            });

            app.get('/menu/:id', async (req, res) => {
                  const id = req.params.id;
                  const query = { _id: new ObjectId(id) }
                  const result = await menuCollection.findOne(query)
                  res.send(result)
            })


            // Reviews Data
            app.get("/reviews", async (req, res) => {
                  const result = await reviewsCollection.find().toArray()
                  res.send(result)
            })


            // User Related Data
            app.get('/users', verifyToken, async (req, res) => {
                  const result = await userCollection.find().toArray()
                  res.send(result)
            })
            app.get('/users/admin/:email', verifyToken, async (req, res) => {
                  const email = req.params.email;
                  if (email !== req.decoded.email) {
                        return res.status(403).send({ message: 'forbidden access' })
                  }
                  const query = { email: email }
                  const user = await userCollection.findOne(query)
                  let admin = false
                  if (user) {
                        admin = user?.role === 'admin';
                  }
                  res.send({ admin })
            })

            app.post("/users", async (req, res) => {
                  const user = req.body;
                  const query = { email: user.email }
                  const existingUsers = await userCollection.findOne(query)
                  if (existingUsers) {
                        return res.send({ message: 'User Already exists', insertedId: null })
                  }
                  const result = await userCollection.insertOne(user)
                  res.send(result)
            })



            app.delete('/users/:id', async (req, res) => {
                  const id = req.params.id
                  const query = { _id: new ObjectId(id) }
                  const result = await userCollection.deleteOne(query)
                  res.send(result)
            })
            app.patch('/users/admin/:id', verifyAdmin, verifyToken, async (req, res) => {
                  const id = req.params.id
                  const query = { _id: new ObjectId(id) }
                  const updateDoc = {
                        $set: {
                              role: 'admin'
                        }
                  }
                  const result = await userCollection.updateOne(query, updateDoc)
                  res.send(result)
            })

            // Carts Related Data
            app.get("/carts", async (req, res) => {
                  const email = req.query.email
                  const query = { email: email }
                  const result = await cartsCollection.find(query).toArray()
                  res.send(result)
            })
            app.post('/carts', async (req, res) => {
                  const cartItem = req.body;
                  const result = await cartsCollection.insertOne(cartItem)
                  res.send(result)
            })
            app.delete('/carts/:id', async (req, res) => {
                  const id = req.params.id
                  const query = { _id: new ObjectId(id) }
                  const result = await cartsCollection.deleteOne(query)
                  res.send(result)
            })



            // Payment Related Api

            // Payment Intent
            app.post("/create-payment-intent", async (req, res) => {
                  const { price } = req.body;
                  const amount = parseInt(price * 100);
                  console.log('amount', amount)
                  try {
                        const paymentIntent = await stripe.paymentIntents.create({
                              amount: amount,
                              currency: "usd",
                              payment_method_types: ["card"],
                        });
                        res.send({
                              clientSecret: paymentIntent.client_secret,
                        });
                  } catch (error) {
                        res.status(500).send({ error: error.message });
                  }
            });



            app.post("/payments", async (req, res) => {
                  const payment = req.body;
                  console.log("payment", payment);
                  const paymentResult = await paymentsCollection.insertOne(payment);

                  const query = {
                        _id: {
                              $in: payment.cartIds.map((id) => new ObjectId(id)),
                        },
                  };
                  const deleteResult = await cartsCollection.deleteMany(query);
                  res.send({ paymentResult, deleteResult });
            });

            // Get payment
            app.get("/payments/:email", verifyToken, async (req, res) => {
                  const query = { email: req.params.email };

                  if (req.params.email !== req.decoded.email) {
                        return res.status(403).send({ message: "forbidden access" });
                  }

                  try {
                        const result = await paymentsCollection.find(query).toArray();
                        res.send(result);
                  } catch (error) {
                        res.status(500).send({ message: "Internal server error" });
                  }
            });



            await client.db("admin").command({ ping: 1 });
            console.log("Mongodb Connected successfully!");
      } finally {
      }
}
run().catch(console.dir);
// Mongobd Connect End




app.get('/', (req, res) => {
      res.send('Bistro is Running!')
})
app.listen(port, () => {
      console.log(`Bistro boss is Sitting On Port ${port}`)
})