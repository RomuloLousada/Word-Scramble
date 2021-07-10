const fs = require("fs");
const readline = require("readline");

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
      this.assetsPath = "./assets";
  
      this.accentuation = this.getFileContents(this.assetsPath, "accentuation", "json");
      this.messages = this.getFileContents(this.assetsPath, "messages", "json");
      this.score = this.getFileContents(this.assetsPath, "score", "json");
      this.words = this.getFileContents(this.assetsPath, "words", "json").words;

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
        if (letters.length > 0) {
          letters = this.formatWord(letters);
          
          if (letters.length > 0) {
            this.rl.question(this.messages.BONUS_POSITION, (bonus) => {
              if (this.checkBonusPosition(bonus)) {
                let words = this.buildWords(letters);
  
                if(words.length > 0) {
                  words = this.scoreWords(words, bonus);
                  const winner = this.rankWords(words);
                  
                  this.printWinner(winner);
                } else {
                  letters = this.formatUnusedLetters(letters);
                  this.printNoWords(letters);
                }
              } else {
                this.printBonusHint();
              }
              this.getUserInputs();
            });
          } else {
            this.printLettersHint();
          }
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
   * filter the array of words getting the highest scores.
   * 
   * If the remaining array has more than 1 object, it will apply the next rule,
   * sorting the words by length. The lowest lengths will come first, and another
   * filter will be applied.
   * 
   * If the remaining array still have more than 1 object, the last rule will take
   * place and order the words alphabetically, and get the first position.
   * 
   * At last, it will return the object inside the array.
   * 
   * @param Array array - Contains an array of objects containing all the matched words.
   * 
   * @return object
   * @throws Error
   * 
   * @author Rômulo Alves Lousada
   */
  rankWords = (array) => {
    try {
      array = this.sortWordsByScore(array);
      array = this.filterHighestScores(array);
      
      if (array.length > 1) {
        array = this.sortWordsByLength(array);
        array = this.filterLowestLengths(array);
  
        if (array.length > 1) {
          array = this.sortWordsAlphabetically(array);
          array.splice(1);
        }
      }
      
      return array.shift();
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
   * @param Array array - Contains an array of objects containing all the matched words.
   * @param Int bonus - Bonus position to double the letter score.
   * 
   * @return array
   * @throws Error
   * 
   * @author Rômulo Alves Lousada
   */
  scoreWords = (array, bonus) => {
    try {
      for (let object in array) {
        let score = 0;
  
        for(let index in array[object].word) {
          const letter = array[object].word[index];
          let letterScore = this.score[letter];

          if (parseInt(++index) === parseInt(bonus)) {
            letterScore *= 2;
          }

          score += letterScore;
        }
  
        array[object].score = score;
      }
  
      return array;
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
   * After that, save the database word in a backup variable. It will loop on
   * every character of the inputted letter and try to find of the current letter
   * is present inside the backup word.
   * 
   * If it's found, remove the first occurence of that letter from the backup word.
   * Otherwise, save the letter in a string of unused letters.
   * 
   * By the end of the loop, if the backup word is an empty string, it means the
   * backup word could be entirely matched by the inputted letters, therefore,
   * saving the word and the unused letters.
   * 
   * @param String letters - User inputted letters.
   * 
   * @return array
   * @throws Error
   * 
   * @author Rômulo Alves Lousada
   */
  buildWords = (letters) => {
    try {
      const builtWords = [];
  
      for (let word of this.words) {
        word = this.formatWord(word);
        
        let backupWord = word;
        let unusedLetters = "";
        
        for (let letter of letters) {
          const index = backupWord.indexOf(letter);
  
          if(index !== -1) {
            backupWord = backupWord.slice(0, index) + backupWord.slice(index + 1);
          } else {
            unusedLetters += letter;
          }
        }
  
        if (backupWord.length === 0) {
          unusedLetters = this.formatUnusedLetters(unusedLetters);

          builtWords.push({
            word,
            unusedLetters
          });
        }
      }
      
      return builtWords;
    } catch (error) {
      throw error;
    }
  };

  /***************************************************************/
  /*********************** BONUS POSITION ************************/
  /***************************************************************/

  /**
   * Check Bonus Position
   * 
   * This function will check if the bonus position can be converted to
   * a valid positive integer.
   * 
   * @param String bonus - Inputted bonus position.
   * 
   * @return bool
   * @throws Error
   * 
   * @author Rômulo Alves Lousada
   */
  checkBonusPosition = (bonus) => {
    bonus = this.removeWhitespaces(bonus);

    return (!isNaN(bonus) && parseInt(bonus) >= 0);
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
   * @param Array array - Contains an array of objects containing all the matched words.
   * 
   * @return array
   * @throws Error
   * 
   * @author Rômulo Alves Lousada
   */
  sortWordsByScore = (array) => {
    try {
      return array.sort((a, b) => {
        return (a.score < b.score) ? 1 : (a.score > b.score) ? - 1 : 0;
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
   * @param Array array - Contains an array of objects containing all the matched words.
   * 
   * @return array
   * @throws Error
   * 
   * @author Rômulo Alves Lousada
   */
  sortWordsByLength = (array) => {
    try {
      return array.sort((a, b) => {
        return (a.word.length > b.word.length) ? 1 : (a.word.length < b.word.length) ? -1 : 0;
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
   * @param Array array - Contains an array of objects containing all the matched words.
   * 
   * @return array
   * @throws Error
   * 
   * @author Rômulo Alves Lousada
   */
  sortWordsAlphabetically = (array) => {
    try {
      return array.sort((a, b) => {
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
   * Highest Score Filter
   *
   * This function will filter the highest score words matched.
   * 
   * More than one word can be returned.
   *
   * @param Array array - Contains an array of objects containing all the matched words.
   *
   * @return array
   * @throws Error
   *
   * @author Rômulo Alves Lousada
   */
  filterHighestScores = (array) => {
    try {
      const highestScore = array[0].score;
      
      return array.filter((object) => {
        if (object.score === highestScore) {
          return true;
        }
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Lowest Length Filter
   *
   * This function will filter the lowest length words matched.
   *
   * More than one word can be returned.
   *
   * @param Array array - Contains an array of objects containing all the matched words.
   *
   * @return array
   * @throws Error
   *
   * @author Rômulo Alves Lousada
   */
  filterLowestLengths = (array) => {
    try {
      const lowestLength = array[0].word.length;
  
      return array.filter((a) => {
        if (a.word.length === lowestLength) {
          return true;
        }
      });
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
   * @param String letters - Unused letters grouped as a single string.
   *
   * @return array
   * @throws Error
   *
   * @author Rômulo Alves Lousada
   */
  formatUnusedLetters = (letters) => {
    const letterArray = [...letters];

    return letterArray.join(', ');
  }

  /**
   * Word Format Main Function
   *
   * This is the core function of word formatting, that calls all other
   * formatting functions.
   *
   * First, it will uppercase all letters, then remove whitespaces, numbers,
   * accentuations and special characters.
   *
   * After those, return a clean string containing only valid letters.
   *
   * @param String letters - Contains a string with characters that are being 
   *                         formatted to remove all invalid characters.
   *
   * @return string
   * @throws Error
   *
   * @author Rômulo Alves Lousada
   */
  formatWord = (letters) => {
    try {
      letters = this.uppercase(letters);
      letters = this.removeWhitespaces(letters);
      letters = this.removeNumbers(letters);
      letters = this.removeAccentuation(letters);
      letters = this.removeSpecialCharacters(letters);
  
      return letters;
    } catch (error) {
      throw error;
    }
  };

  /**
   * Uppercase Word
   *
   * Receives a string and return it uppercased.
   *
   * @param String letters - Contains a string with characters to be uppercased
   *
   * @return string
   * @throws Error
   *
   * @author Rômulo Alves Lousada
   */
  uppercase = (letters) => {
    try {
      return letters.toUpperCase();
    } catch (error) {
      throw error;
    }
  };

  /**
   * Remove Whitespaces from Word
   *
   * Receives a string and return it without whitespaces.
   *
   * @param String letters - Contains a string with characters to remove whitespaces
   *
   * @return string
   * @throws Error
   *
   * @author Rômulo Alves Lousada
   */
  removeWhitespaces = (letters) => {
    try {
      return letters.replace(/ /g, "")
    } catch (error) {
      throw error;
    }
  }

  /**
   * Remove Numbers from Word
   *
   * Receives a string and return it without numbers.
   *
   * @param String letters - Contains a string with characters to remove numbers
   *
   * @return string
   * @throws Error
   *
   * @author Rômulo Alves Lousada
   */
  removeNumbers = (letters) => {
    try {
      return letters.replace(/[0-9]+/g, "");
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
   * @param String letters - Contains a string with characters to remove accentuation
   *
   * @return string
   * @throws Error
   *
   * @author Rômulo Alves Lousada
   */
  removeAccentuation = (letters) => {
    try {
      for (let letter of letters) {
        if (letter in this.accentuation) {
          letters = letters.replace(letter, this.accentuation[letter]);
        }
      }
  
      return letters;
    } catch (error) {
      throw error;
    }
  };

  /**
   * Remove Special Characters from Word
   *
   * Receives any special character not considered a valid letter.
   * 
   * @param String letters - Contains a string with characters to remove special characters
   *
   * @return string
   * @throws Error
   *
   * @author Rômulo Alves Lousada
   */
  removeSpecialCharacters = (letters) => {
    try {
      return letters.replace(/[^\w\s]+/g, "");
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
   * @param String letters - Inputted letters by the user.
   * 
   * @return void
   * @throws Error
   *
   * @author Rômulo Alves Lousada
   */
  printNoWords = (letters) => {
    try {
      this.printMessage(this.messages.BLANK);
      this.printMessage(this.messages.NO_WORD_FOUND);
      this.printMessage(`${this.messages.WORDS_LEFT} ${letters}`);
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
      this.printMessage(`${this.messages.WORDS_LEFT} ${winner.unusedLetters}.`);
      this.printMessage(this.messages.BLANK);
      this.printMessage(this.messages.SEPARATOR);
      this.printMessage(this.messages.BLANK);
    } catch (error) {
      throw error;
    }
  };
}


module.exports = WordScramble;