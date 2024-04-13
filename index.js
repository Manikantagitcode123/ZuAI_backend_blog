const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const cors = require("cors"); // Import cors middleware
const path = require("path");
const { on } = require("events");

const app = express();
app.use(bodyParser.json());
app.use(cors()); // Use cors middleware

const dbpath = path.join(__dirname, "ecomerse.db");
let db = null;

const initializeDbAndServer = async () => {
    try {
        db = await open({
            filename: dbpath,
            driver: sqlite3.Database,
        });
        app.listen(3001, () => {
            console.log("Server started on port 3001");
        });
    } catch (e) {
        console.error("DB Error:", e.message);
        process.exit(1);
    }
};

initializeDbAndServer();

app.get("/", (request, response) => {
    response.send("Server is running");
});

app.get("/table", async (request, response) => {
    const createTableQuery = `CREATE TABLE IF NOT EXISTS user(
        username VARCHAR(255),
        password VARCHAR(255)
    )`;
    try {
        await db.run(createTableQuery);
        response.send("Table created successfully");
    } catch (error) {
        console.error("Error creating table:", error);
        response.status(500).send("Internal Server Error");
    }
});
app.get("/ptable",async(request,response)=>{
    const query=`CREATE TABLE products(
        productid VARCHAR(250),
        productname VARCHAR(250),
        productimg VARCHAR(250),
        productprice int,
        productdescription VARCHAR(1000),
        productbrand VARCHAR(250)
    )`
    try{
        await db.run(query);
        response.send("created product table")
    }catch (error){
        console.log(error)
        response.send("internal server error")
    }
})

app.post("/users/", async (request, response) => {
    const { username, password } = request.body;
    if (!password) {
        response.status(400).send("Password is required");
        return;
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const selectUserQuery = `SELECT * FROM user WHERE username = ?`;
        const existingUser = await db.get(selectUserQuery, [username]);
        if (existingUser) {
            response.status(400).send("User already exists");
            return;
        }
        const insertUserQuery = `INSERT INTO user (username, password) VALUES (?, ?)`;
        await db.run(insertUserQuery, [username, hashedPassword]);
        response.status(200).send("User created successfully");
    } catch (error) {
        console.error("Error creating user:", error);
        response.status(500).send("Internal Server Error");
    }
});

app.post("/login/", async (request, response) => {
    const { username, password } = request.body;
    const selectUserQuery = `SELECT * FROM user WHERE username = ?`;
    try {
        const user = await db.get(selectUserQuery, [username]);
        if (!user) {
            response.status(400).send("Invalid username or password");
            return;
        }
        const isPasswordMatched = await bcrypt.compare(password, user.password);
        if (!isPasswordMatched) {
            response.status(400).send("Invalid username or password");
            return;
        }
        const payload = { username: user.username };
        const jwtToken = jwt.sign(payload, "mani");
        response.send({jwtToken});
    } catch (error) {
        console.error("Error verifying user:", error);
        response.status(500).send("Internal Server Error");
    }
});

app.get("/products/", async (request, response) => {
    
    try {
       
        
        const query=`SELECT * from products`
        const data=await db.all(query)
        response.send({data})
        response.status(200)
        // Add logic to fetch products
        //response.send("Products will be fetched here");
    } catch (error) {
        console.error("Error verifying token:", error);
        response.status(401).send("Unauthorized");
    }
});
app.post("/createproduct",async(request,response)=>{
    const{productid,productname,productimg,productdescription,productprice,productbrand}=request.body
    const query=`INSERT INTO products(
        productid,
        productname,
        productimg,
        productprice,
        productdescription,
        productbrand)
        VALUES(?,?,?,?,?,?)`
    try{
        await db.run(query, [productid,productname,productimg,productprice,productdescription,productbrand]);
        response.status(200).send("productcreatedsuccessfully");
    }catch (error){
        console.error("Error creating user:", error);
        response.status(500).send("Internal Server Error");

    }
})

app.post("/singleproduct/",async(request,response)=>{
    const{id}=request.body 
    const onname=JSON.stringify(id)
    console.log(id)
    console.log(onname)
    //console.log(name)
    const query=`SELECT * FROM products WHERE productid=${onname}`
    try{
        const data=await db.all(query)
        console.log(data)
        response.status(200)
        response.send(data)

    }catch(error){
        response.status(400)
        response.send("error")
    }
    

})
app.post("/deleteproduct/",async(request,response)=>{
    const{id}=request.body
    const onname=JSON.stringify(id)
    //console.log(id)
    //console.log(onname)
    
    //console.log(onname)
    const query=`DELETE FROM products WHERE productid=${onname}`
    try{
        const okk=await db.run(query)
        //console.log(okk)
        response.status(200)
        response.send("deleted succesfully")
    }catch(error){
        response.status(400)
        response.send("error")
    }

})