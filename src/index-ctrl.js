/** 
 * @typedef {Object} Book
 * @property {string} Book.name
 * @property {Chapter[]} Book.chapters
 */

/** 
 * @typedef {Object} Chapter
 * @property {Book} Chapter.book
 * @property {number} Chapter.number
 * @property {Verse[]} Chapter.verses
 */

/** 
 * @typedef {Object} Verse
 * @property {Chapter} Verse.chapter
 * @property {number} Verse.number
 * @property {number} Verse.length
 */

/**
 * @typedef {Object} Period
 * @property {Book} Period.book
 * @property {Chapter} Period.chapter
 * @property {Verse} Period.verse
 * @property {Date} Period.date
 */

/**
 * @typedef {Object} DailyPlan
 * @property {Date} DailyPlan.date
 * @property {Verse} DailyPlan.startVerse
 * @property {Verse} DailyPlan.endVerse
 * @property {number} DailyPlan.length
 */

class IndexCtrl {
  /** @param {angular.IHttpService} $http */
  constructor($http) {
    /** @type {Book[]} */
    this.books = [];

    /** @type {Period} */
    this.from = {};

    /** @type {Period} */
    this.to = {};

    /** @type {DailyPlan[]} */
    this.dailyPlans = [];

    this.dailyPlansText = '';

    $http
      .get('verses.json')
      .then(response => {
        this.books = response.data;
        for (const book of this.books) {
          for (const chapter of book.chapters) {
            chapter.book = book;
            for (const verse of chapter.verses) {
              verse.chapter = chapter;
            }
          }
        }

        const now = new Date();

        this.from = {
          book: this.books[0],
          chapter: this.books[0].chapters[0],
          verse: this.books[0].chapters[0].verses[0],
          date: now,
        };

        const lastBook = this.books[this.books.length - 1];
        const lastChapter = lastBook.chapters[lastBook.chapters.length - 1];
        const lastVerse = lastChapter.verses[lastChapter.verses.length - 1];

        this.to = {
          book: lastBook,
          chapter: lastChapter,
          verse: lastVerse,
          date: new Date(now.getFullYear(), 11, 31),
        };
      });
  }

  onGenerate() {
    const dates = getDatesBetween(this.from.date, this.to.date);
    const verses = this.getVersesBetween(this.from.verse, this.to.verse);
    const targetDailyLength = verses.map(e => e.length).reduce((p, c) => p + c, 0) / dates.length;
    /** @type {DailyPlan[]} */
    const dailyPlans = [];
    let dateIndex = 0;
    let actualLength = 0;
    let length = 0;
    /** @type {DailyPlan} */
    let dailyPlan = null;
    for (const verse of verses) {
      if (!dailyPlan) {
        dailyPlan = {
          date: dates[dateIndex],
          startVerse: verse,
        };
      }
      length += verse.length;
      actualLength += verse.length;
      if (length >= targetDailyLength) {
        dailyPlan.endVerse = verse;
        dailyPlan.length = actualLength;
        dailyPlans.push(dailyPlan);
        dailyPlan = null;
        length -= targetDailyLength;
        actualLength = 0;
        dateIndex++;
      }
    }
    if (dailyPlan) {
      dailyPlan.endVerse = this.to.verse;
      dailyPlan.length = actualLength;
      dailyPlans.push(dailyPlan);
    }
    this.dailyPlans = dailyPlans;

    this.dailyPlansText = this.dailyPlans.map(e => `${formatDate(e.date)}\t${formatVerse(e.startVerse)}\t${formatVerse(e.endVerse)}`).join('\n');
  }

  /**
   * @param {Verse} verse 
   * @return {Verse}
   */
  next(verse) {
    const nextVerseNumber = verse.number + 1;
    const chapter = verse.chapter;
    const nextVerse = chapter.verses.find(e => e.number === nextVerseNumber);
    if (!nextVerse) {
      const nextChapterNumber = chapter.number + 1;
      const book = chapter.book;
      const nextChapter = book.chapters.find(e => e.number === nextChapterNumber);
      if (!nextChapter) {
        const nextBookIndex = this.books.findIndex(e => e.name === book.name) + 1;
        const nextBook = this.books[nextBookIndex];
        return nextBook.chapters[0].verses[0];
      }
      return nextChapter.verses[0];
    }
    return nextVerse;
  }

  /**
   * @param {Verse} from 
   * @param {Verse} to 
   * @return {Verse[]}
   */
  getVersesBetween(from, to) {
    /** @type {Verse[]} */
    const verses = [];
    let verse = from;
    while (true) {
      verses.push(verse);
      if (getVerseHash(verse) == getVerseHash(to)) {
        break;
      }
      verse = this.next(verse);
    }
    return verses;
  }
}

IndexCtrl.$inject = ['$http'];

/**
 * @param {Date} from 
 * @param {Date} to 
 * @return {Date[]}
 */
function getDatesBetween(from, to) {
  const dates = [];
  let date = new Date(from);
  while (true) {
    dates.push(new Date(date));
    if (getDateHash(date) === getDateHash(to)) {
      break;
    }
    date.setDate(date.getDate() + 1);
  }
  return dates;
}

/** 
 * @param {Date} date
 * @return {string}
 */
function getDateHash(date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

/**
 * @param {Verse} verse 
 * @return {string}
 */
function getVerseHash(verse) {
  return `${verse.chapter.book.name}-${verse.chapter.number}-${verse.number}`;
}

/**
 * @param {Verse} verse
 * @return {string}
 */
function formatVerse(verse) {
  return `${verse.chapter.book.name} ${verse.chapter.number}:${verse.number}`;
}

/**
 * @param {Date} date 
 * @return {string}
 */
function formatDate(date) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

module.exports = IndexCtrl;
