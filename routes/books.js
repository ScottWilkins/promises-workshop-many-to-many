var express = require('express');
var router = express.Router();
var knex = require('../db/knex');
var helpers = require('../lib/helpers')

function Books() {
  return knex('books');
}

function Authors_Books() {
  return knex('authors_books');
}

function Authors() {
  return knex('authors');
}

router.get('/', function(req, res, next) {

  // your code here
  //   // get all books from Books
  //   // THEN for each book, go get all of their author ids from Authors_Books
  //   // THEN go get all that book's authors
  //   // AND add the array of authors to the book object as 'authors'
  //   // render the appropriate template
  //   // pass an array of books to the view using locals

  Books().then(function(books){
    Promise.all(books.map(book=>{
      return Authors_Books().where('book_id', book.id).pluck('author_id').then(function(authorIds){
        return Authors().whereIn('id', authorIds).then(function(authors){
          book.authors=authors;
          return books;
        })
      })
    })
  ).then(function(books){
      res.render('books/index', {books:books[0]})
  })
})
});


router.get('/new', function(req, res, next) {
  res.render('books/new');
});

router.post('/', function (req, res, next) {
  var errors = [];
  if(!req.body.title.trim()){errors.push("Title cannot be blank")}
  if(!req.body.genre.trim()){errors.push("Genre cannot be blank")}
  if(!req.body.cover_url.trim()){errors.push("Cover image cannot be blank")}
  if(!req.body.description.trim()){errors.push("Description cannot be blank")}
  if(errors.length){
    res.render('books/new', { book: req.body, errors: errors })
  } else {
    Books().insert(req.body).then(function (results) {
        res.redirect('/');
    })
  }
})

router.get('/:id/delete', function(req, res, next) {
  Books().where('id', req.params.id).first().then(function (book) {
    helpers.getBookAuthors(book).then(function (bookAuthors) {
      console.log(bookAuthors);
      Authors().select().then(function (authors) {
        res.render('books/delete', {authors: authors, book: book });
      })
    })
  })
});

router.post('/:id/delete', function(req, res, next) {
  Books().where('id', req.params.id).del().then(function (book) {
    res.redirect('/books');
  })
});

router.get('/:id/edit', function(req, res, next) {
  Books().where('id', req.params.id).first().then(function (book) {
    res.render('books/edit', {book: book});
  })
});

router.get('/:id', function(req, res, next) {
  // return book and array of authors that wrote it
  Books().where('id', req.params.id).then(function(book){
    Authors_Books().where('book_id', req.params.id).pluck('author_id').then(function(authIds){
      Authors().whereIn('id', authIds).then(function(authors){
        res.render('books/show', {book:book[0], authors:authors})
      })
    })
  })
});

router.post('/:id', function(req, res, next) {
  var errors = [];
  if(!req.body.title.trim()){errors.push("Title cannot be blank")}
  if(!req.body.genre.trim()){errors.push("Genre cannot be blank")}
  if(!req.body.cover_url.trim()){errors.push("Cover image cannot be blank")}
  if(!req.body.description.trim()){errors.push("Description cannot be blank")}
  if(errors.length){
    res.render('books/edit', { book: req.body, errors: errors })
  } else {
    Books().where('id', req.params.id).update(req.body).then(function (results) {
      res.redirect('/');
    })
  }
});

module.exports = router;
