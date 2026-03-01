import wordList from "../../assets/scrabble_words.txt?raw";

interface TrieNode {
    children: Record<string, TrieNode>;
    isEnd: boolean;
}

function createNode(): TrieNode {
    return { children: {}, isEnd: false };
}

export class Trie {
    private root: TrieNode = createNode();

    insert(word: string): void {
        let node = this.root;
        for (const char of word.toUpperCase()) {
            if (!node.children[char]) {
                node.children[char] = createNode();
            }
            node = node.children[char]!;
        }
        node.isEnd = true;
    }

    search(word: string): boolean {
        let node = this.root;
        for (const char of word.toUpperCase()) {
            if (!node.children[char]) return false;
            node = node.children[char]!;
        }
        return node.isEnd;
    }

    startsWith(prefix: string): boolean {
        let node = this.root;
        for (const char of prefix.toUpperCase()) {
            if (!node.children[char]) return false;
            node = node.children[char]!;
        }
        return true;
    }

    loadWords(words: string[]): void {
        for (const word of words) {
            if (word.length >= 2) this.insert(word);
        }
    }
}

// Singleton — trie is built once on first call, reused after
let trieInstance: Trie | null = null;

export function getScrabbleTrie(): Trie {
    if (trieInstance) return trieInstance;

    trieInstance = new Trie();

    const words = wordList
        .split("\n")
        .map(w => w.trim())
        .filter(w => w.length >= 2 && /^[a-zA-Z]+$/.test(w));

    trieInstance.loadWords(words);
    console.log(`[Trie] Loaded ${words.length} words`);

    return trieInstance;
}