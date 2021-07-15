const fs = require("fs");
const readline = require("readline");
const path = require('path');

/**
 * Word Scramble
 * 
 * This class contains all logic needed to execute the Word Scramble application.
 * 
 * It will ask for user inputs and guide how it should be filled in order to work.
 *
 * @author Rômulo Alves Lousada
 */
class WordScramble {

  /**
   * Class constructor.
   * 
   * Initializes class properties upon creation.
   * 
   * @return void
   * @throws Error
   * 
   * @author Rômulo Alves Lousada
   */
  constructor() {
    try {
      const appDir = path.dirname(require.main.filename);
      const assetsPath = `${appDir}/assets`;
  
      this.accentuation = this.getFileContents(assetsPath, "accentuation", "json");
      this.messages = this.getFileContents(assetsPath, "messages", "json");
      this.score = this.getFileContents(assetsPath, "score", "json");
      this.words = this.getFileContents(assetsPath, "words", "json").words;

      this.rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
    } catch (error) {
      throw error;
    }
  };

  /***************************************************************/
  /********************* STARTING FUNCTION ***********************/
  /***************************************************************/

  /**
   * Starting Function.
   * 
   * The starting point of the application. This function will be calling
   * a looping function to get user inputs needed.
   * 
   * @return void
   * @throws Error
   * 
   * @author Rômulo Alves Lousada
   */
  start = () => {
    try {
      this.printTitle();
      this.getUserInputs();

    } catch (error) {
      throw error;
    }
  };

  /***************************************************************/
  /******************** USER INPUT LISTENER **********************/
  /***************************************************************/

  /**
   * Gets User Inputs.
   * 
   * Main function that will loop and request for user inputs needed to run the
   * application.
   * 
   * It will also call all functions needed to format the inputted letters,
   * rearrange the letters to match any words from the database, retrieve the
   * score of the words that could be matched and rank it according to the
   * ranking rules to find the winner.
   * 
   * After that, it will print the result and prompt again for the user input
   * to play another round.
   * 
   * @return void
   * @throws Error
   * 
   * @author Rômulo Alves Lousada
   */
  getUserInputs = () => {
    try {
      this.rl.question(this.messages.LETTERS_ENTRY, (letters) => {
        const input = { letters };
        this.formatWord(input, 'letters');
        
        if (input.letters.length > 0) {
          this.rl.question(this.messages.BONUS_POSITION, (position) => {
            const bonus = { position };

            if (this.checkBonusPosition(bonus)) {
              const matchedWords = this.buildWords(input);

              if(matchedWords.length > 0) {
                this.scoreWords(matchedWords, bonus);
                this.rankWords(matchedWords);

                this.printWinner(matchedWords[0]);
              } else {
                this.formatUnusedLetters(input);
                this.printNoWords(input);
              }
            } else {
              this.printBonusHint();
            }

            this.getUserInputs();
          });
        } else {
          this.printLettersHint();
        }

        this.getUserInputs();
      });
    } catch (error) {
      throw error;
    }
  };

  /***************************************************************/
  /******************** MAIN WORD FUNCTIONS **********************/
  /***************************************************************/

  /**
   * Rank Matched Words.
   * 
   * Function used to rank the words that could be matched from user inputted
   * letters.
   * 
   * It will sort the matched words for highest score first. After that, will
   * filter the array of words removing the lower scores.
   * 
   * If the remaining array has more than 1 object, it will apply the next rule,
   * sorting the words by length. The lower lengths will come first, and remove
   * the higher lengths.
   * 
   * If the remaining array still have more than 1 object, the last rule will take
   * place and order the words alphabetically, and get the first position.
   * 
   * @param Array matchedWords - Array of objects containing all matched words.
   * 
   * @return void
   * @throws Error
   * 
   * @author Rômulo Alves Lousada
   */
  rankWords = (matchedWords) => {
    try {
      this.sortWordsByScore(matchedWords);
      this.removeLowerScores(matchedWords);
      
      if (matchedWords.length > 1) {
        this.sortWordsByLength(matchedWords);
        this.removeHigherLengths(matchedWords);
  
        if (matchedWords.length > 1) {
          this.sortWordsAlphabetically(matchedWords);
        }
      }
    } catch (error) {
      throw error;
    }
  };

  /**
   * Score Matched Words.
   * 
   * Function used to return the score of every matched word from user input.
   * 
   * It will loop on every character of every word inside the array, and use
   * the score database file to get the letter score. 
   * 
   * After that, it will check if the position of the letter is a bonus position
   * the user requested. If it's bonus, the letter score will be doubled.
   * 
   * After looping for every letter of the word, it will save the score inside
   * the word object and return the array with all scores calculated.
   * 
   * @param Array matchedWords - Array of objects containing all matched words.
   * @param Object bonus - Object with the position of the bonus letter.
   * 
   * @return void
   * @throws Error
   * 
   * @author Rômulo Alves Lousada
   */
  scoreWords = (matchedWords, bonus) => {
    try {
      for (let match of matchedWords) {
        let score = 0;

        for(let index in match.word) {
          let letterScore = this.score[match.word[index]];

          if (parseInt(++index) === parseInt(bonus.position)) {
            letterScore *= 2;
          }

          score += letterScore;
        }

        match.score = score;
      }
    } catch (error) {
      throw error;
    }
  };

  /**
   * Build Matched Words.
   * 
   * Function used to find any words that match the inputted letters entirely.
   * 
   * It will loop on every word of the word database file. For every word,
   * format it by the same word formatting functions used to format the
   * inputted letters from the user.
   * 
   * After that, create two arrays containing each letter from the database word 
   * and inputted letters and pass it to a function to check if the word can be
   * matched with the inputted letters
   * 
   * If it's true, it means the word could be entirely matched by the inputted 
   * letters. Then the unused letters are formatted and saved in an array
   * with the word and the unused letters.
   * 
   * @param Object input - Object with the letters to build the words.
   * 
   * @return array
   * @throws Error
   * 
   * @author Rômulo Alves Lousada
   */
  buildWords = (input) => {
    try {
      const matchedWords = [];
  
      for (let word of this.words) {
        const databaseWord = { letters: word };

        this.formatWord(databaseWord, 'letters');

        const spreadWord = [...databaseWord.letters];
        const spreadInput = [...input.letters];

        const match = this.matchWord(spreadWord, spreadInput);

        if (match.check) {
          this.formatUnusedLetters(match.unused);

          matchedWords.push({
            word: databaseWord.letters,
            unusedLetters: match.unused.letters
          })
        }
      }
      
      return matchedWords;
    } catch (error) {
      throw error;
    }
  };

  /**
   * Matches the Word with Inputted Letters.
   * 
   * This function will loop on the inputted letters and try to find if the
   * letter can be found on the database word that's being analyzed.
   * 
   * If it can't find the letter on the database word, it will save the letter
   * in an array of unused letters.
   * 
   * If it can find the letter inside the word, it will remove that letter from
   * the word array and then check if the word array is empty. If it is empty,
   * it will then get all the remaining letters inside the input array that
   * weren't looped yet and merge it into the unused letters array and return
   * true and the unused letters as an array.
   * 
   * In case it loops on every inputted letter and there are letters inside the
   * database word array, it means the word couldn't be entirely matched
   * by the inputted letters and return false.
   * 
   * @param Array word - Array with letters of database word.
   * @param Array input - Array with letters inputted by the user.
   * 
   * @return object
   * @throws Error
   * 
   * @author Rômulo Alves Lousada
   */
  matchWord = (word, input) => {
    const unused = { letters: [] };

    for (let letter in input) {
      const index = word.indexOf(input[letter]);

      if (index !== -1) {
        word.splice(index, 1);

        if (word.length === 0) {
          const rest = input.splice(parseInt(letter) + 1);
          unused.letters = [...unused.letters, ...rest];
          return { check: true, unused };
        }
      } else {
        unused.letters.push(input[letter]);
      }
    }

    return { check: false };
  }

  /***************************************************************/
  /*********************** BONUS POSITION ************************/
  /***************************************************************/

  /**
   * Check Bonus Position
   * 
   * This function will remove all whitespaces from the bonus position and
   * then check if it can be converted to a valid positive integer.
   * 
   * @param Object bonus - Object with the position of the bonus letter.
   * 
   * @return bool
   * @throws Error
   * 
   * @author Rômulo Alves Lousada
   */
  checkBonusPosition = (bonus) => {
    this.removeWhitespaces(bonus, 'position');

    return (!isNaN(bonus.position) && parseInt(bonus.position) >= 0);
  };

  /***************************************************************/
  /************************* ARRAY SORT **************************/
  /***************************************************************/

  /**
   * Sort by Score.
   * 
   * This function will sort the array of matched words by score.
   * 
   * The highest score words will be sorted first.
   * 
   * @param Array matchedWords - Array of objects containing all matched words.
   * 
   * @return void
   * @throws Error
   * 
   * @author Rômulo Alves Lousada
   */
  sortWordsByScore = (matchedWords) => {
    try {
      matchedWords.sort((a, b) => {
        return b.score - a.score;
      });
    } catch (error) {
      throw error;
    }
  };

  /**
   * Sort by Length.
   * 
   * This function will sort the array of matched words by length.
   * 
   * The lowest length words will be sorted first.
   * 
   * @param Array matchedWords - Array of objects containing all matched words.
   * 
   * @return void
   * @throws Error
   * 
   * @author Rômulo Alves Lousada
   */
  sortWordsByLength = (matchedWords) => {
    try {
      matchedWords.sort((a, b) => {
        return a.word.length - b.word.length;
      });
    } catch (error) {
      throw error;
    }
  };

  /**
   * Sort Alphabetically.
   * 
   * This function will sort the array of matched words alphabetically.
   * 
   * @param Array array - Array of objects containing all matched words.
   * 
   * @return array
   * @throws Error
   * 
   * @author Rômulo Alves Lousada
   */
  sortWordsAlphabetically = (matchedWords) => {
    try {
      matchedWords.sort((a, b) => {
        return a.word.localeCompare(b.word);
      });
    } catch (error) {
      throw error;
    }
  }

  /***************************************************************/
  /************************ ARRAY FILTER *************************/
  /***************************************************************/

  /**
   * Remove Lower Scores
   *
   * This function will get the highest score inside the matched words array and
   * remove any object that has a lower score.
   * 
   * More than one word can be returned.
   *
   * @param Array matchedWords - Array of objects containing all matched words.
   *
   * @return void
   * @throws Error
   *
   * @author Rômulo Alves Lousada
   */
  removeLowerScores = (matchedWords) => {
    try {
      const { score } = matchedWords[0];
      
      for (let index in matchedWords) {
        if(matchedWords[index].score !== score) {
          matchedWords.length = index;
          break;
        }
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Remove Higher Lengths
   *
   * This function will get the lowest length word inside the matched words array 
   * and remove any object that has a higher word length.
   *
   * More than one word can be returned.
   *
   * @param Array matchedWords - Array of objects containing all matched words.
   *
   * @return void
   * @throws Error
   *
   * @author Rômulo Alves Lousada
   */
  removeHigherLengths = (matchedWords) => {
    try {
      const { word } = matchedWords[0];
  
      for (let index in matchedWords) {
        if (matchedWords[index].word.length > word.length) {
          matchedWords.length = index;
          break;
        }
      }
    } catch (error) {
      throw error;
    }
  }

  /***************************************************************/
  /*********************** WORD FORMATTING ***********************/
  /***************************************************************/

  /**
   * Unused Letters Format
   *
   * This function will format a string of letters to display as a message.
   * 
   * Usually, unused letters is a string with all letters grouped.
   * 
   * This function will first convert the string into an array and then use
   * the join function to return the array as an string using a separator.
   *
   * @param Object unused - Object with the letters that weren't used in the word creation.
   *
   * @return void
   * @throws Error
   *
   * @author Rômulo Alves Lousada
   */
  formatUnusedLetters = (unused) => {
    const array = [...unused.letters];

    unused.letters = array.join(', ');
  }

  /**
   * Word Format Main Function
   *
   * This is the core function of word formatting, that calls all other
   * formatting functions.
   *
   * First, it will remove whitespaces and numbers.
   * Then uppercase and remove accentuation.
   * At last, remove any special characters from the remaining letters.
   *
   * @param Object word - Object with letters string that will be formatted.
   * @param String key - Key used to access the object value.
   *
   * @return void
   * @throws Error
   *
   * @author Rômulo Alves Lousada
   */
  formatWord = (word, key) => {
    try {
      this.removeWhitespaces(word, key);
      this.removeNumbers(word, key);
      this.removeSpecialCharacters(word, key);
      this.uppercase(word, key);
      this.removeAccentuation(word, key);
    } catch (error) {
      throw error;
    }
  };

  /**
   * Remove Whitespaces from Word
   *
   * Receives an object with the string and return it without whitespaces.
   *
   * @param Object word - Object with characters to remove whitespaces.
   * @param String key - Key used to access the object value.
   *
   * @return string
   * @throws Error
   *
   * @author Rômulo Alves Lousada
   */
  removeWhitespaces = (word, key) => {
    try {
      word[key]= word[key].replace(/ /g, "")
    } catch (error) {
      throw error;
    }
  }

  /**
   * Remove Numbers from Word
   *
   * Receives a string and return it without numbers.
   *
   * @param Object word - Object with characters to remove numbers
   * @param String key - Key used to access the object value.
   *
   * @return string
   * @throws Error
   *
   * @author Rômulo Alves Lousada
   */
  removeNumbers = (word, key) => {
    try {
      word[key] = word[key].replace(/[0-9]+/g, "");
    } catch (error) {
      throw error;
    }
  };

  /**
   * Remove Special Characters from Word
   *
   * Receives any special character not considered a valid letter.
   * 
   * @param Object word - Object with characters to remove special characters
   * @param String key - Key used to access the object value.
   *
   * @return string
   * @throws Error
   *
   * @author Rômulo Alves Lousada
   */
  removeSpecialCharacters = (word, key) => {
    try {
      word[key] = word[key].replace(/[^a-zà-üA-ZÀ-Ü]+/g, "");
    } catch (error) {
      throw error;
    }
  };

  /**
   * Uppercase Word
   *
   * Receives an object with the string and return it uppercased.
   *
   * @param Object word - Object with characters to be uppercased.
   * @param String key - Key used to access the object value.
   *
   * @return void
   * @throws Error
   *
   * @author Rômulo Alves Lousada
   */
  uppercase = (word, key) => {
    try {
      word[key] = word[key].toUpperCase();
    } catch (error) {
      throw error;
    }
  };

  /**
   * Remove Accentuation from Word
   *
   * Receives a string and return it without accentuation.
   * 
   * It will follow the rules of replacement found in accentuation file.
   * 
   * @param Object word - Object with characters to remove accentuation
   * @param String key - Key used to access the object value.
   *
   * @return string
   * @throws Error
   *
   * @author Rômulo Alves Lousada
   */
  removeAccentuation = (word, key) => {
    try {
      for (let letter of word[key]) {
        if (letter in this.accentuation) {
          word[key] = word[key].replace(letter, this.accentuation[letter]);
        }
      }
    } catch (error) {
      throw error;
    }
  };

  /***************************************************************/
  /*********************** FILE FUNCTIONS ************************/
  /***************************************************************/

  /**
   * Return contents from a file.
   *
   * It will first check if the file exists before trying to access it's content.
   * 
   * If it pass the check, return as a JSON the contents of the file.
   * 
   * @param String path - Base path to the file.
   * @param String file - Name of the file to be loaded.
   * @param String extension - File extension to be loaded.
   *
   * @return object
   * @throws Error
   *
   * @author Rômulo Alves Lousada
   */
  getFileContents = (path, file, extension) => {
    try {
      this.checkFileExist(path, file, extension);
      
      return JSON.parse(fs.readFileSync(`${path}/${file}.${extension}`));
    } catch (error) {
      throw error;
    }
  };
  
  /**
   * Verify if File Exists
   *
   * This function will check if the file exists according to the parameters
   * received.
   * 
   * If it doesn't find a file, throws an exception warning the file that is
   * missing.
   * 
   * @param String path - Base path to the file.
   * @param String file - Name of the file to be loaded.
   * @param String extension - File extension to be loaded.
   *
   * @return void
   * @throws Error
   *
   * @author Rômulo Alves Lousada
   */
  checkFileExist = (path, file, extension) => {
    try {
      const fileExist = fs.existsSync(`${path}/${file}.${extension}`);
      
      if (!fileExist) {
        throw `Ocorreu um erro ao tentar carregar o arquivo ${file}.${extension}. Ele não existe no diretório.`;
      }
    } catch (error) {
      throw error;
    }
  };

  /***************************************************************/
  /*********************** PRINT FUNCTIONS ***********************/
  /***************************************************************/

  /**
   * Prints a Message on Terminal
   *
   * This is the main function to output messages on the terminal.
   * 
   * It will receive the message that should be outputted.
   * 
   * @param String message - Message that will be shown on the terminal.
   *
   * @return void
   * @throws Error
   *
   * @author Rômulo Alves Lousada
   */
  printMessage = (message) => {
    try {
      console.log(message);
    } catch (error) {
      throw error;
    }
  };

  /**
   * Print Title
   *
   * Function that will print the title displayed at the beggining of the app.
   * 
   * @return void
   * @throws Error
   *
   * @author Rômulo Alves Lousada
   */
  printTitle = () => {
    try {
      this.printMessage(this.messages.BLANK);
      this.printMessage(this.messages.SEPARATOR);
      this.printMessage(this.messages.TITLE);
      this.printMessage(this.messages.SEPARATOR);
      this.printMessage(this.messages.BLANK);
    } catch (error) {
      throw error;
    }
  };

  /**
   * Print No Words
   *
   * Function that will print in case no words are found after the user
   * inputted the letters he wants to play with.
   * 
   * @param Object input - Object with inputted letters by the user.
   * 
   * @return void
   * @throws Error
   *
   * @author Rômulo Alves Lousada
   */
  printNoWords = (input) => {
    try {
      this.printMessage(this.messages.BLANK);
      this.printMessage(this.messages.NO_WORD_FOUND);
      this.printMessage(`${this.messages.UNUSED_LETTERS} ${input.letters}`);
      this.printMessage(this.messages.BLANK);
      this.printMessage(this.messages.SEPARATOR);
      this.printMessage(this.messages.BLANK);
    } catch (error) {
      throw error;
    }
  };

  /**
   * Print Letters Hint
   *
   * Function that will print the hint in case the user doesn't type any
   * valid character.
   * 
   * @return void
   * @throws Error
   *
   * @author Rômulo Alves Lousada
   */
  printLettersHint = () => {
    try {
      this.printMessage(this.messages.BLANK);
      this.printMessage(this.messages.INVALID_CHARACTERS_WARNING);
      this.printMessage(this.messages.VALID_CHARACTERS_HINT);
      this.printMessage(this.messages.BLANK);
      this.printMessage(this.messages.SEPARATOR);
      this.printMessage(this.messages.BLANK);
    } catch (error) {
      throw error;
    }
  };

  /**
   * Print Bonus Hint
   *
   * Function that will print the hint in case the user doesn't type a valid
   * number for bonus position.
   * 
   * @return void
   * @throws Error
   *
   * @author Rômulo Alves Lousada
   */
  printBonusHint = () => {
    try {
      this.printMessage(this.messages.BLANK);
      this.printMessage(this.messages.BONUS_POSITION_HINT);
      this.printMessage(this.messages.BONUS_POSITION_DISABLE);
      this.printMessage(this.messages.BLANK);
      this.printMessage(this.messages.SEPARATOR);
      this.printMessage(this.messages.BLANK);
    } catch (error) {
      throw error;
    }
  };

  /**
   * Print Winner
   *
   * After all functions to rank the matched words are done, prints the best
   * word match according to the rules.
   * 
   * @param Object winner - Object containing all the information of the winner word.
   * 
   * @return void
   * @throws Error
   *
   * @author Rômulo Alves Lousada
   */
  printWinner = (winner) => {
    try {
      this.printMessage(this.messages.BLANK);
      this.printMessage(`${winner.word}, palavra de ${winner.score} pontos.`);

      if (winner.unusedLetters.length) {
        this.printMessage(`${this.messages.UNUSED_LETTERS} ${winner.unusedLetters}.`);
      } else {
        this.printMessage(this.messages.ALL_LETTERS_USED);
      }

      this.printMessage(this.messages.BLANK);
      this.printMessage(this.messages.SEPARATOR);
      this.printMessage(this.messages.BLANK);
    } catch (error) {
      throw error;
    }
  };
}


module.exports = WordScramble;