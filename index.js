import express from 'express';
import pg  from "pg";
import bodyParser from 'body-parser';
// import axios from "axios";

const app = express();
const port = 3000;
const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    password: "12345",
    database: "book notes",
    port: 5432
})

db.connect();


app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.get("/", async(req,res)=>{
    
    // Get list of all books from database
    try{
    var result = await db.query("SELECT books.title,books.id,books.isbn,book_details.score,book_details.date FROM books JOIN book_details ON books.id = book_details.book_id");
    }catch(err){
        console.log(err);
    }
   
   res.render("index.ejs",({books: result.rows }));
})

app.get("/add", async(req,res)=>{
   res.render("add.ejs")
})

app.post("/add",async (req,res)=>{ 
    try{
  const result = await db.query("INSERT INTO books (title, isbn) VALUES ($1, $2) RETURNING * ",[req.body.bookTitle, req.body.bookIsbn]);
  await db.query("INSERT INTO book_details (score, date , book_id) VALUES ($1, $2, $3)",[req.body.bookScore, req.body.bookDate,result.rows[0].id]);
  await db.query("INSERT INTO book_descriptions (description, book_id) VALUES ($1, $2)",[req.body.bookDescription, result.rows[0].id]);
   res.redirect(`/book/${result.rows[0].id}`);
    }catch(err){
        console.log(err);
    }
})

app.get("/book/:id",async (req,res) =>{
    const id = req.params.id;
    const result = await db.query("SELECT books.title,books.id,books.isbn,book_details.score,book_details.date,book_descriptions.description FROM books JOIN book_details ON books.id = book_details.book_id JOIN book_descriptions ON books.id = book_descriptions.book_id WHERE books.id = $1",[id]);
    
    res.render("book.ejs",({books: result.rows[0]}));
})

app.post("/delete", async(req,res)=>{
    try{
        await db.query("DELETE FROM book_descriptions WHERE book_id = $1;",[req.body.bookId]);
        await db.query("DELETE FROM book_details WHERE book_id = $1;",[req.body.bookId]);
        await db.query("DELETE FROM books WHERE id = $1; ",[req.body.bookId]);
        res.redirect("/")
    }catch(err){
        console.log(err)
    }
})

app.post("/edit", async(req,res)=>{
    const id = req.body.bookId;
    const result = await db.query("SELECT books.title,books.id,books.isbn,book_details.score,book_details.date,book_descriptions.description FROM books JOIN book_details ON books.id = book_details.book_id JOIN book_descriptions ON books.id = book_descriptions.book_id WHERE books.id = $1",[id]);
    res.render("edit.ejs",({book: result.rows[0]}));
})

app.post("/update",async (req,res)=>{
    try{
     await db.query("UPDATE books SET (title, isbn) = ($1, $2) WHERE id = $3",[req.body.bookTitle, req.body.bookIsbn, req.body.bookId]);
     await db.query("UPDATE book_details SET (score, date) = ($1, $2) WHERE book_id = $3",[req.body.bookScore, req.body.bookDate, req.body.bookId]);
     await db.query("UPDATE book_descriptions SET description = $1 WHERE book_id = $2",[req.body.bookDescription, req.body.bookId]);
     res.redirect(`/book/${req.body.bookId}`);
    }
    catch(err){
        console.log(err);
    }
})
app.listen(port, ()=>{
    console.log(`Server running on port ${port}`)
})



// Get book cover with axios
/*

async function getCover(isbn){
    try{
    const result = await axios.get(`https://covers.openlibrary.org/b/ISBN/${isbn}-M.jpg`, { responseType: 'arraybuffer' });
    const buffer64 = Buffer.from(result.data, 'binary').toString('base64')
    return buffer64 ;
    } catch(err){
        console.log(err);
    }
}


if(result.rows.isbn){
   const img = await getCover(result.isbn);
   var image = "data:image/jpeg;base64, "+ img;
   }else{
    var image = "./images/images.jpg";
   }

   */