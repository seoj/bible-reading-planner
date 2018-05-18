/**
 * @typedef {Object} VersesResponse
 * @property {number} VersesResponse.bookOrdinal
 * @property {number} VersesResponse.chapterNum
 * @property {string} VersesResponse.bookName
 * @property {number} VersesResponse.verseNum
 * @property {number} VersesResponse.textLength
 */

/**
 * @typedef {Object} VerseRange
 * @property {Verse} VerseRange.fromVerse
 * @property {Verse} VerseRange.toVerse
 */

class Book {
  /**
   * @param {number} ordinal 
   * @param {string} name 
   * @param {Chapter[]} chapters 
   */
  constructor(ordinal = 0, name = '', chapters = []) {
    this.ordinal = ordinal;
    this.name = name;
    this.chapters = chapters;
  }
}

class Chapter {
  /**
   * @param {number} number 
   * @param {Verse[]} verses 
   */
  constructor(number = 0, verses = []) {
    this.number = number;
    this.verses = verses;
  }
}

class Verse {
  /**
   * @param {number} id
   * @param {Book} book 
   * @param {Chapter} chapter 
   * @param {number} number 
   * @param {number} textLength 
   */
  constructor(id = 0, book = null, chapter = null, number = 0, textLength = 0) {
    this.id = id;
    this.book = book;
    this.chapter = chapter;
    this.number = number;
    this.textLength = textLength;
  }
}

class DailyPlan {
  /**
   * @param {Date} date 
   * @param {Verse} fromVerse 
   * @param {Verse} toVerse 
   */
  constructor(date = null, fromVerse = null, toVerse = null) {
    this.date = new Date(date);
    this.fromVerse = fromVerse;
    this.toVerse = toVerse;
  }
}

class IndexCtrl {
  constructor($http) {
    /** @type {Book[]} */
    this.books = [];
    /** @type {Map<number,Verse>} */
    this.verses = new Map();
    /** @type {Book} */
    this.fromBook = null;
    /** @type {Chapter} */
    this.fromChapter = null;
    /** @type {Book} */
    this.toBook = null;
    /** @type {Chapter} */
    this.toChapter = null;
    /** @type {VerseRange} */
    this.range = {};
    /** @type {Date} */
    this.fromDate = new Date();
    /** @type {Date} */
    this.toDate = new Date(this.fromDate);
    this.toDate.setMonth(11);
    this.toDate.setDate(31);
    /** @type {DailyPlan[]} */
    this.dailyPlans = [];

    $http.get('verses.json').then(response => {
      /** @type {VersesResponse[]} */
      const versesResponse = response.data;

      /** @type {Book} */
      let currBook;
      /** @type {Chapter} */
      let currChapter;
      let verseId = 0;
      for (const e of versesResponse) {
        if (!currBook || currBook.name !== e.bookName) {
          currBook = new Book(e.bookOrdinal, e.bookName);
          this.books.push(currBook);
        }
        if (!currChapter || currChapter.number !== e.chapterNum) {
          currChapter = new Chapter(e.chapterNum);
          currBook.chapters.push(currChapter);
        }
        const verse = new Verse(verseId++, currBook, currChapter, e.verseNum, e.textLength);
        currChapter.verses.push(verse);
        this.verses.set(verse.id, verse);
      }

      this.fromBook = this.books[0];
      this.fromChapter = this.fromBook.chapters[0];
      this.range.fromVerse = this.fromChapter.verses[0];
      this.toBook = this.books[this.books.length - 1];
      this.toChapter = this.toBook.chapters[this.toBook.chapters.length - 1];
      this.range.toVerse = this.toChapter.verses[this.toChapter.verses.length - 1];
    });
  }

  onCreatePlan() {
    this.dailyPlans = [];

    const fromVerse = this.range.fromVerse;
    const toVerse = this.range.toVerse;

    let numberOfDays = getDateRange(this.fromDate, this.toDate);
    let totalTextLength = 0;
    for (let i = fromVerse.id; i <= toVerse.id; i++) {
      totalTextLength += this.verses.get(i).textLength;
    }
    const dailyTextLengthTarget = totalTextLength / numberOfDays;
    let textLengthQuota = dailyTextLengthTarget;
    let startVerse = null;
    let currDate = new Date(this.fromDate);
    for (let i = fromVerse.id; i <= toVerse.id; i++) {
      const verse = this.verses.get(i);
      if (!startVerse) {
        startVerse = verse;
      }
      textLengthQuota -= verse.textLength;
      if (textLengthQuota <= 0 || i === toVerse.id) {
        this.dailyPlans.push(new DailyPlan(currDate, startVerse, verse));
        textLengthQuota += dailyTextLengthTarget;
        startVerse = null;
        incrementDate(currDate);
      }
    }
  }
}

function getDateRange(from, to) {
  const date = new Date(from);
  let numberOfDays = 1;
  while (true) {
    numberOfDays++;
    incrementDate(date);
    if (date.getTime() >= to.getTime()) {
      break;
    }
  }
  return numberOfDays;
}

function incrementDate(date) {
  date.setDate(date.getDate() + 1);
}

/**
 * @param {Verse} verse 
 * @return {string}
 */
function verseToString(verse) {
  return `${verse.book.name} ${verse.chapter.number}:${verse.number}`;
}

/**
 * @param {Verse} verse 
 * @return {string}
 */
function verseFilter(verse) {
  return verseToString(verse);
}

angular.module('bible', [])
  .controller('IndexCtrl', IndexCtrl)
  .filter('verse', () => verseFilter);