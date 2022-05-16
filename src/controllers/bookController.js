const bookModel = require("../models/bookModel.js");
const reviewModel = require("../models/reviewModel")
const  mongoose = require("mongoose");

//---------------------------------------Validadtor------------------------------------------
const isValid = function (value) {
    if (typeof value === "undefined" || value === null) return false;
    if (typeof value != "string" || value.trim().length == 0) return false;
    return true;
};
  
const isValidRequestBody = function (requestBody) {
    return Object.keys(requestBody).length > 0;
};
  
const isValidObjectId = function (objectId) {
   return mongoose.Types.ObjectId.isValid(objectId);
};
  
//-------------------------------------------POST API {Create books}--------------------------------------------//

const createBook = async function (req, res) {
    try {
      let requestBody = req.body;
      let { title, excerpt, userId, ISBN, category, subcategory,reviews, releasedAt } = requestBody;
      
      if (!isValidObjectId(userId)) {
        return res.status(400).send({status: false, message: 'Userid is not a valid ObjectId'})
      }
      if (userId != req.userId) {
        return res.status(403).send({status: false, message: 'Unauthorised Access'})  //.....Authorisation
      }  
      if (!isValidRequestBody(requestBody)) {
        return res.status(400).send({ status: false, msg: "Please provide details of the User" });
      }
      if (!isValid(title)) {
        return res.status(400).send({status: false, msg: 'Enter appropriate title of the Book'});
      }
      if (!isValid(excerpt)) {
        return res.status(400).send({ status: false, msg: "Enter appropriate Body of the book " });
      }
      if (!isValid(ISBN)) {
        return res.status(400).send({ status: false, msg: "Enter appropriate ISBN." });
      }
      if (!isValid(category)) {
        return res.status(400).send({ status: false, msg: "Enter appropriate category" });
      }
      if (!isValid(subcategory)) {
        return res.status(400).send({ status: false, msg: "Enter appropriate password" });
      }
      if (ISBN.length != 13) {
        return res.status(400).send({ status: false, msg: "Enter 10 digit ISBN no. of Book" });
      }
     
      const bookData = {  title, excerpt, userId, ISBN, category, subcategory,reviews, releasedAt };
      const newBook = await bookModel.create(bookData);
      return res.status(201).send({ status: true, message: 'Success', data: newBook });
    } catch (error) {
      return res.status(500).send({ status: false, msg: error.message });
    }
};

//---------------------------------------------GET API {get books by query parameters}------------------------------------------------------//

const getBooks = async function (req, res){
    try {  
      let checkObject ={ isDeleted:false }
  
      if (isValid(req.query.userId)){checkObject.userId =req.query.userId}
      
      if(req.query.userId){
      if(!isValidObjectId(req.query.userId)){     
        return res.status(400).send({status: false, message: `${req.query.userId}It is not a valid user id`})
        }}
      if (req.query.userId != req.userId) {
          return res.status(403).send({status: false, message: 'Unauthorised Access'})  //.....Authorisation
      }  
      if (isValid(req.query.category)){checkObject.category =req.query.category}
  
      if (isValid(req.query.subcategory)){checkObject.subcategory =req.query.subcategory}     
     
      let search = await bookModel.find(checkObject).select({ISBN:0,subcategory:0,isDeleted:0,createdAt:0,updatedAt:0,__v:0}).sort({title:1});
      if (!search) {
        return res.status(404).send({status: false, message: 'Book Not found'}) 
      }  
     
      if (search.length == 0){
         return res.status(404).send({ status: false, message:"No such book exist" }) }
       
      return res.status(200).send({ status: true, message:"Book list", data:search})   
    
    } catch (error) {  
      return res.status(500).send({ status: false, error: error.message });
    }
}

//------------------------------------------GET API {get books by bookId}----------------------------------------//

const getBooksBYId = async function (req, res) {
    try {  
      let bookId = req.params.bookId;
  
      if(!isValidObjectId(bookId)){       
        return res.status(400).send({status: false, message: `${bookId} is not a valid book id`})
        }
  
      const bookDetail = await bookModel.findOne({ _id: bookId, isDeleted: false });
      if(!bookDetail){
        return res.status(404).send({status:false, message:"book not found"})}

      if (bookDetail.userId != req.userId) {
        return res.status(403).send({status: false, message: 'Unauthorised Access'})  //.....Authorisation
      }  
  
      const reviewsData = await reviewModel.find({ bookId: bookId, isDeleted: false }).select({ _id: 1, bookId: 1, reviewedBy: 1, rating:1, review: 1, releasedAt: 1 });;      
      
      return res.status(200).send({ status: true, data: {...bookDetail.toObject(),reviewsData}});
  
    } catch (error){  
      return res.status(500).send({ status: false, error: error.message });      
    }
  }


//------------------------------------------------PUT API {update books details}------------------------------------------------------------------//

const updateBook = async function (req, res) {
  try {
    let requestBody = req.body;
    
    
    if (!isValidRequestBody(requestBody)) {
      return res.status(400).send({ status: false, message: 'Invalid request parameters. Please provide  details to update' })
      }
    let bookId = req.params.bookId;

    if(!isValidObjectId(bookId)) {      
      return res.status(400).send({status: false, message: `${bookId} is not a valid book id`})
      }

    let bookIdCheck = await bookModel.findOne({ _id: bookId, isDeleted: false })

    if(!bookIdCheck){    
      return res.status(404).send({status:false,message:'book not found'}) }
    
    if (bookIdCheck.userId != req.userId) {
      return res.status(403).send({status: false, message: 'Unauthorised Access'})  //.....Authorisation
    }  

    let uniqueCheck = await bookModel.find({$or: [{ title: requestBody.title }, { ISBN: requestBody.ISBN }]} )
    
    if (uniqueCheck.length > 0) {  
      return res.status(400).send({ status: false, msg: 'Either title or isbn number is unique' })}

    let updateObject ={}

    if (isValid(requestBody.title)) {
      updateObject.title = requestBody.title}

    if (isValid(requestBody.excerpt)) {
      updateObject.excerpt = requestBody.excerpt}
      
    if (isValid(requestBody.releasedAt)) {
      updateObject.releasedAt = requestBody.releasedAt}

    if (isValid(requestBody.ISBN)) {
      updateObject.ISBN = requestBody.ISBN}
    
    let update = await bookModel.findOneAndUpdate({ _id: bookId },updateObject , { new: true })

    return res.status(200).send({ status: true, message: 'sucessfully updated', data: update })

  } catch (error) {
    return res.status(500).send({ status: false, error: error.message });
  }
}

//--------------------------------------DELETE API {delte books by bookId}-------------------------------//

const deleteBook = async function (req, res) {
    try {
        let bookId = req.params.bookId
        let findData = await bookModel.findById(bookId)
        if (findData.userId != req.userId) {
          return res.status(403).send({status: false, message: 'Unauthorised Access'})  //.....Authorisation
        }
  
        if (!findData)
            return res.status(404).send({ status: false, message: "no such book exists" })
        if (findData.isDeleted == true)
            return res.status(400).send({ status: false, msg: "Book is already deleted" })
        let deletedata = await bookModel.findOneAndUpdate({ _id: bookId }, { $set: { isDeleted: true, deletedAt: new Date() } }, { new: true});
        if(deletedata) {
          return res.status(200).send({ status: true, msg: "Successfully Deleted"})
        }
    }
    catch (error) {
        return res.status(500).send({ status: false, msg: error.message })
    }
};




module.exports = { createBook,getBooks, getBooksBYId, updateBook, deleteBook };