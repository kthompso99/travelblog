/**
 * Shared readline prompt utilities for interactive CLI tools.
 */

const readline = require('readline');

/**
 * Prompt the user with a single question and return the trimmed answer.
 * Creates and closes a readline interface per call.
 *
 * @param {string} question - The prompt text to display
 * @returns {Promise<string>} The user's trimmed response
 */
function prompt(question) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise(resolve => {
        rl.question(question, answer => {
            rl.close();
            resolve(answer.trim());
        });
    });
}

/**
 * Create a prompt session for asking multiple questions.
 * The caller must call close() when done.
 *
 * @returns {{ ask: function(string): Promise<string>, close: function() }}
 */
function createPromptSession() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const ask = (question) => new Promise(resolve => rl.question(question, resolve));
    const close = () => rl.close();

    return { ask, close };
}

module.exports = { prompt, createPromptSession };
