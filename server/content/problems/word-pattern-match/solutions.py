APPROACHES = {"brute": ("O(n^2)", "O(n)"), "optimal": ("O(n)", "O(n)")}


def brute(pattern, sentence):
    words = sentence.split(" ")
    if len(words) != len(pattern):
        return False
    for i in range(len(pattern)):
        for j in range(i + 1, len(pattern)):
            if (pattern[i] == pattern[j]) != (words[i] == words[j]):
                return False
    return True


def optimal(pattern, sentence):
    words = sentence.split(" ")
    if len(words) != len(pattern):
        return False
    letter_to_word = {}
    word_to_letter = {}
    for letter, word in zip(pattern, words):
        if letter_to_word.get(letter, word) != word or word_to_letter.get(word, letter) != letter:
            return False
        letter_to_word[letter] = word
        word_to_letter[word] = letter
    return True


def gen(rng):
    pattern = "".join(rng.choice("abc") for _ in range(rng.randint(1, 5)))
    if rng.random() < 0.5:
        mapping = {c: rng.choice(["dog", "cat", "fish"]) for c in "abc"}
        words = [mapping[c] for c in pattern]
    else:
        words = [rng.choice(["dog", "cat", "fish"]) for _ in range(rng.randint(1, 5))]
    return [pattern, " ".join(words)]
