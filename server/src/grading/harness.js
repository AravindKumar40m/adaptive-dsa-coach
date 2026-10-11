// Builds the program Judge0 actually runs: the learner's code + a small hidden "harness" that
// reads the tests from stdin, calls the learner's function once per test and prints one marked
// result line per test:  @@R<nonce>@@<testIndex>:<result>@@   (result = encoded value, or ERR:<name>)
// The marker lets us ignore anything the learner prints themselves.
//
// Supported types (the same text format in all four languages, so Java/C++ need no JSON parser):
//   parameter  int         "123"
//              int[]       "<len> a1 a2 ..."
//              int[][]     "<rows> <len1> a.. <len2> b.."  (one line)
//              string      hex of the UTF-8 bytes
//              ListNode    "<len> v1 v2 ..."                (the harness builds the linked list)
//              CycleList   "<len> v1 .. vn <pos>"           (tail points to node <pos>, -1 = no cycle)
//              TreeNode    "<count> t1 t2 ..."              (level order, N = missing child)
//   return     int, bool ("true"/"false"), int[] ("<len> a.."), string (hex), ListNode, TreeNode (same encodings as above)
//
// All languages: the learner writes only the function. ListNode / TreeNode classes are provided.

export const camel = (snake) => snake.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());

export const PARAM_TYPES = new Set(["int", "int[]", "int[][]", "string", "ListNode", "CycleList", "TreeNode"]);
export const RETURN_TYPES = new Set(["int", "bool", "int[]", "string", "ListNode", "TreeNode"]);

const NODE_TYPES = new Set(["ListNode", "CycleList", "TreeNode"]);
const usesNodes = (sig) => sig.params.some((p) => NODE_TYPES.has(p.type)) || NODE_TYPES.has(sig.returns);
const hexOf = (s) => Buffer.from(s, "utf8").toString("hex");
const trimNulls = (arr) => {
  const a = [...arr];
  while (a.length && a[a.length - 1] === null) a.pop();
  return a;
};
const treeTokens = (v) => {
  const t = trimNulls(v);
  return [t.length, ...t.map((x) => (x === null ? "N" : x))].join(" ");
};

// ------------------------------------------------------------------ value <-> text (server side)
/** A test's expected value as the text the harness prints for a correct answer. */
export function encodeValue(type, v) {
  if (type === "int" || type === "bool") return String(v);
  if (type === "int[]" || type === "ListNode") return [v.length, ...v].join(" ");
  if (type === "string") return hexOf(v);
  if (type === "TreeNode") return treeTokens(v);
  throw new Error(`unsupported type: ${type}`);
}

/** The harness's text back into a plain value (to show the learner what their code returned). */
export function decodeValue(type, text) {
  if (type === "int") return Number(text);
  if (type === "bool") return text === "true";
  if (type === "string") return Buffer.from(text, "hex").toString("utf8");
  const tokens = text.trim().split(/\s+/).slice(1);
  if (type === "int[]" || type === "ListNode") return tokens.map(Number);
  if (type === "TreeNode") return tokens.map((x) => (x === "N" ? null : Number(x)));
  throw new Error(`unsupported type: ${type}`);
}

export function encodeInput(signature, tests) {
  const lines = [String(tests.length)];
  for (const t of tests) {
    signature.params.forEach((p, i) => {
      const v = t.args[i];
      switch (p.type) {
        case "int": lines.push(String(v)); break;
        case "int[]": case "ListNode": lines.push([v.length, ...v].join(" ")); break;
        case "int[][]": lines.push([v.length, ...v.flatMap((row) => [row.length, ...row])].join(" ")); break;
        case "string": lines.push(hexOf(v)); break;
        case "CycleList": lines.push([v[0].length, ...v[0], v[1]].join(" ")); break; // v = [values, pos]
        case "TreeNode": lines.push(treeTokens(v)); break;
        default: throw new Error(`unsupported parameter type: ${p.type}`);
      }
    });
  }
  return lines.join("\n") + "\n";
}

const marker = (nonce) => `@@R${nonce}@@`;

// ================================================================== Python
const PY_CLASSES = String.raw`class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next


class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right


`;

const PY_HELPERS = String.raw`    def __matrix(__line):
        __t = __line.split()
        __rows, __k = [], 1
        for __r in range(int(__t[0])):
            __c = int(__t[__k]); __k += 1
            __rows.append([int(__x) for __x in __t[__k:__k + __c]]); __k += __c
        return __rows

    def __make_list(__t):
        __head = None
        for __x in reversed(__t):
            __head = ListNode(int(__x), __head)
        return __head

    def __make_cycle(__t):
        __n = int(__t[0])
        __nodes = [ListNode(int(__x)) for __x in __t[1:1 + __n]]
        for __k in range(__n - 1):
            __nodes[__k].next = __nodes[__k + 1]
        __pos = int(__t[1 + __n])
        if __n > 0 and __pos >= 0:
            __nodes[-1].next = __nodes[__pos]
        return __nodes[0] if __n > 0 else None

    def __make_tree(__t):
        if not __t or __t[0] == "N":
            return None
        __root = TreeNode(int(__t[0]))
        __queue = [__root]
        __qi = 0
        __k = 1
        while __qi < len(__queue) and __k < len(__t):
            __node = __queue[__qi]; __qi += 1
            if __t[__k] != "N":
                __node.left = TreeNode(int(__t[__k])); __queue.append(__node.left)
            __k += 1
            if __k < len(__t):
                if __t[__k] != "N":
                    __node.right = TreeNode(int(__t[__k])); __queue.append(__node.right)
                __k += 1
        return __root

    def __fmt_ints(__a):
        if not isinstance(__a, list) or not all(type(__x) is int for __x in __a):
            return "ERR:BadType"
        return " ".join([str(len(__a))] + [str(__x) for __x in __a])

    def __fmt_list(__head):
        __vals = []
        while __head is not None:
            __vals.append(__head.val)
            if len(__vals) > 300000:
                return "ERR:Cycle"
            __head = __head.next
        return " ".join([str(len(__vals))] + [str(__v) for __v in __vals])

    def __fmt_tree(__root):
        if __root is None:
            return "0"
        __out = []
        __queue = [__root]
        __qi = 0
        while __qi < len(__queue):
            __node = __queue[__qi]; __qi += 1
            if __node is None:
                __out.append("N")
            else:
                __out.append(str(__node.val))
                __queue.append(__node.left)
                __queue.append(__node.right)
            if len(__queue) > 600000:
                return "ERR:Cycle"
        while __out and __out[-1] == "N":
            __out.pop()
        return " ".join([str(len(__out))] + __out)

`;

const PY_PARSE = {
  int: "__args.append(int(__lines[__p])); __p += 1",
  "int[]": "__a = __lines[__p].split(); __p += 1; __args.append([int(__x) for __x in __a[1:]])",
  string: '__args.append(bytes.fromhex(__lines[__p].strip()).decode("utf-8")); __p += 1',
  "int[][]": "__args.append(__matrix(__lines[__p])); __p += 1",
  ListNode: "__args.append(__make_list(__lines[__p].split()[1:])); __p += 1",
  CycleList: "__args.append(__make_cycle(__lines[__p].split())); __p += 1",
  TreeNode: "__args.append(__make_tree(__lines[__p].split()[1:])); __p += 1",
};
const PY_FORMAT = {
  int: 'str(__r) if type(__r) is int else "ERR:BadType"',
  bool: '"true" if __r is True else ("false" if __r is False else "ERR:BadType")',
  "int[]": "__fmt_ints(__r)",
  string: '__r.encode("utf-8").hex() if isinstance(__r, str) else "ERR:BadType"',
  ListNode: '__fmt_list(__r) if (__r is None or isinstance(__r, ListNode)) else "ERR:BadType"',
  TreeNode: '__fmt_tree(__r) if (__r is None or isinstance(__r, TreeNode)) else "ERR:BadType"',
};

function pythonSource(code, sig, nonce) {
  const prefix = usesNodes(sig) ? PY_CLASSES : "";
  const source = String.raw`${prefix}${code}


def __run_tests__():
    import sys as __sys
    __lines = __sys.stdin.read().split("\n")
    __p = 0
    __n = int(__lines[__p]); __p += 1

${PY_HELPERS}    for __i in range(__n):
        __args = []
${sig.params.map((p) => "        " + PY_PARSE[p.type]).join("\n")}
        try:
            __r = ${sig.name}(*__args)
            __out = ${PY_FORMAT[sig.returns]}
        except Exception as __e:
            __out = "ERR:" + type(__e).__name__
        __sys.stdout.write("\n${marker(nonce)}" + str(__i) + ":" + __out + "@@\n")
        __sys.stdout.flush()


__run_tests__()
`;
  return { source, lineOffset: prefix.split("\n").length - 1 }; // learner's line 1 is this many lines down
}

// ================================================================== JavaScript (Node)
// The node classes go on the SAME line as the learner's first line so error line numbers match.
const JS_CLASSES =
  "function ListNode(val, next) { this.val = val === undefined ? 0 : val; this.next = next === undefined ? null : next; } " +
  "function TreeNode(val, left, right) { this.val = val === undefined ? 0 : val; this.left = left === undefined ? null : left; this.right = right === undefined ? null : right; } ";

const JS_HELPERS = String.raw`  const matrix = (line) => {
    const t = line.trim().split(/\s+/).map(Number);
    const rows = [];
    let k = 1;
    for (let r = 0; r < t[0]; r++) { const c = t[k++]; rows.push(t.slice(k, k + c)); k += c; }
    return rows;
  };
  const makeList = (t) => {
    let head = null;
    for (let i = t.length - 1; i >= 0; i--) head = new ListNode(Number(t[i]), head);
    return head;
  };
  const makeCycle = (t) => {
    const n = Number(t[0]);
    const nodes = [];
    for (let i = 0; i < n; i++) nodes.push(new ListNode(Number(t[1 + i]), null));
    for (let i = 0; i + 1 < n; i++) nodes[i].next = nodes[i + 1];
    const pos = Number(t[1 + n]);
    if (n > 0 && pos >= 0) nodes[n - 1].next = nodes[pos];
    return n > 0 ? nodes[0] : null;
  };
  const makeTree = (t) => {
    if (t.length === 0 || t[0] === "N") return null;
    const root = new TreeNode(Number(t[0]), null, null);
    const queue = [root];
    let qi = 0, i = 1;
    while (qi < queue.length && i < t.length) {
      const node = queue[qi++];
      if (t[i] !== "N") { node.left = new TreeNode(Number(t[i]), null, null); queue.push(node.left); }
      i++;
      if (i < t.length) {
        if (t[i] !== "N") { node.right = new TreeNode(Number(t[i]), null, null); queue.push(node.right); }
        i++;
      }
    }
    return root;
  };
  const fmtInts = (a) => (Array.isArray(a) && a.every(Number.isInteger)) ? [a.length, ...a].join(" ") : "ERR:BadType";
  const fmtList = (head) => {
    const vals = [];
    while (head !== null) {
      vals.push(head.val);
      if (vals.length > 300000) return "ERR:Cycle";
      head = head.next;
    }
    return [vals.length, ...vals].join(" ");
  };
  const fmtTree = (root) => {
    if (root === null) return "0";
    const out = [];
    const queue = [root];
    for (let qi = 0; qi < queue.length; qi++) {
      const node = queue[qi];
      if (node === null || node === undefined) out.push("N");
      else { out.push(String(node.val)); queue.push(node.left === undefined ? null : node.left); queue.push(node.right === undefined ? null : node.right); }
      if (queue.length > 600000) return "ERR:Cycle";
    }
    while (out.length && out[out.length - 1] === "N") out.pop();
    return [out.length, ...out].join(" ");
  };
  const isNode = (r, key) => r === null || (typeof r === "object" && r !== undefined && key in r);
`;

const JS_PARSE = {
  int: "args.push(Number(lines[p++]));",
  "int[]": String.raw`{ const a = lines[p++].trim().split(/\s+/).map(Number); args.push(a.slice(1)); }`,
  string: 'args.push(Buffer.from(lines[p++].trim(), "hex").toString("utf8"));',
  "int[][]": "args.push(matrix(lines[p++]));",
  ListNode: String.raw`args.push(makeList(lines[p++].trim().split(/\s+/).slice(1)));`,
  CycleList: String.raw`args.push(makeCycle(lines[p++].trim().split(/\s+/)));`,
  TreeNode: String.raw`args.push(makeTree(lines[p++].trim().split(/\s+/).slice(1)));`,
};
const JS_FORMAT = {
  int: 'Number.isInteger(r) ? String(r) : "ERR:BadType"',
  bool: 'r === true ? "true" : (r === false ? "false" : "ERR:BadType")',
  "int[]": "fmtInts(r)",
  string: 'typeof r === "string" ? Buffer.from(r, "utf8").toString("hex") : "ERR:BadType"',
  ListNode: 'isNode(r, "next") ? fmtList(r) : "ERR:BadType"',
  TreeNode: 'isNode(r, "left") ? fmtTree(r) : "ERR:BadType"',
};

function javascriptSource(code, sig, nonce) {
  const prefix = usesNodes(sig) ? JS_CLASSES : "";
  const source = String.raw`${prefix}${code}

;(function () {
  const fs = require("fs");
  const lines = fs.readFileSync(0, "utf8").split("\n");
  let p = 0;
  const n = parseInt(lines[p++], 10);
${JS_HELPERS}  for (let i = 0; i < n; i++) {
    const args = [];
    ${sig.params.map((x) => JS_PARSE[x.type]).join("\n    ")}
    let out;
    try {
      const r = ${camel(sig.name)}(...args);
      out = ${JS_FORMAT[sig.returns]};
    } catch (e) {
      out = "ERR:" + (e && e.name ? e.name : "Error");
    }
    fs.writeSync(1, "\n${marker(nonce)}" + i + ":" + out + "@@\n");
  }
})();
`;
  return { source, lineOffset: 0 };
}

// ================================================================== Java
const JAVA_CLASSES =
  "class ListNode { int val; ListNode next; ListNode() {} ListNode(int val) { this.val = val; } ListNode(int val, ListNode next) { this.val = val; this.next = next; } } " +
  "class TreeNode { int val; TreeNode left, right; TreeNode() {} TreeNode(int val) { this.val = val; } TreeNode(int val, TreeNode left, TreeNode right) { this.val = val; this.left = left; this.right = right; } } ";

const JAVA_HELPERS = String.raw`    static String hex(String h) throws Exception {
        byte[] b = new byte[h.length() / 2];
        for (int i = 0; i < b.length; i++) b[i] = (byte) Integer.parseInt(h.substring(2 * i, 2 * i + 2), 16);
        return new String(b, "UTF-8");
    }
    static String hexOf(String s) throws Exception {
        StringBuilder sb = new StringBuilder();
        for (byte b : s.getBytes("UTF-8")) sb.append(String.format("%02x", b & 0xff));
        return sb.toString();
    }
    static int[][] matrix(String line) {
        String[] t = line.trim().split("\\s+");
        int k = 0;
        int r = Integer.parseInt(t[k++]);
        int[][] m = new int[r][];
        for (int i = 0; i < r; i++) {
            int c = Integer.parseInt(t[k++]);
            m[i] = new int[c];
            for (int j = 0; j < c; j++) m[i][j] = Integer.parseInt(t[k++]);
        }
        return m;
    }
    static ListNode makeList(String line) {
        String[] t = line.trim().split("\\s+");
        int n = Integer.parseInt(t[0]);
        ListNode head = null;
        for (int i = n; i >= 1; i--) head = new ListNode(Integer.parseInt(t[i]), head);
        return head;
    }
    static ListNode makeCycle(String line) {
        String[] t = line.trim().split("\\s+");
        int n = Integer.parseInt(t[0]);
        if (n == 0) return null;
        ListNode[] nodes = new ListNode[n];
        for (int i = 0; i < n; i++) nodes[i] = new ListNode(Integer.parseInt(t[1 + i]));
        for (int i = 0; i + 1 < n; i++) nodes[i].next = nodes[i + 1];
        int pos = Integer.parseInt(t[1 + n]);
        if (pos >= 0) nodes[n - 1].next = nodes[pos];
        return nodes[0];
    }
    static TreeNode makeTree(String line) {
        String[] t = line.trim().split("\\s+");
        int n = Integer.parseInt(t[0]);
        if (n == 0 || t[1].equals("N")) return null;
        TreeNode root = new TreeNode(Integer.parseInt(t[1]));
        ArrayDeque<TreeNode> queue = new ArrayDeque<>();
        queue.add(root);
        int i = 2;
        while (!queue.isEmpty() && i <= n) {
            TreeNode node = queue.poll();
            if (!t[i].equals("N")) { node.left = new TreeNode(Integer.parseInt(t[i])); queue.add(node.left); }
            i++;
            if (i <= n) {
                if (!t[i].equals("N")) { node.right = new TreeNode(Integer.parseInt(t[i])); queue.add(node.right); }
                i++;
            }
        }
        return root;
    }
    static String fmtInts(int[] a) {
        StringBuilder sb = new StringBuilder().append(a.length);
        for (int x : a) sb.append(' ').append(x);
        return sb.toString();
    }
    static String fmtList(ListNode head) {
        StringBuilder sb = new StringBuilder();
        int n = 0;
        while (head != null) {
            sb.append(' ').append(head.val);
            head = head.next;
            if (++n > 300000) throw new IllegalStateException("Cycle");
        }
        return n + sb.toString();
    }
    static String fmtTree(TreeNode root) {
        if (root == null) return "0";
        ArrayList<TreeNode> queue = new ArrayList<>();
        ArrayList<String> out = new ArrayList<>();
        queue.add(root);
        for (int qi = 0; qi < queue.size(); qi++) {
            TreeNode node = queue.get(qi);
            if (node == null) out.add("N");
            else { out.add(String.valueOf(node.val)); queue.add(node.left); queue.add(node.right); }
            if (queue.size() > 600000) throw new IllegalStateException("Cycle");
        }
        while (!out.isEmpty() && out.get(out.size() - 1).equals("N")) out.remove(out.size() - 1);
        StringBuilder sb = new StringBuilder().append(out.size());
        for (String s : out) sb.append(' ').append(s);
        return sb.toString();
    }
`;

const JAVA_T = { int: "int", bool: "boolean", string: "String", "int[]": "int[]", "int[][]": "int[][]", ListNode: "ListNode", CycleList: "ListNode", TreeNode: "TreeNode" };

function javaSource(code, sig, nonce) {
  // Java wants every import before the first class, so the learner's imports move to line 1 (their lines stay, blanked).
  const imports = [];
  const learner = code
    .replace(/\bpublic\s+(final\s+)?class\s+Solution\b/, "class Solution") // only Main may be public
    .replace(/^[ \t]*import[ \t]+(static[ \t]+)?[\w.*]+[ \t]*;[ \t]*$/gm, (m) => { imports.push(m.trim()); return ""; });
  const decl = sig.params
    .map((p, i) => {
      switch (p.type) {
        case "int": return `int p${i} = Integer.parseInt(br.readLine().trim());`;
        case "string": return `String p${i} = hex(br.readLine().trim());`;
        case "int[][]": return `int[][] p${i} = matrix(br.readLine());`;
        case "ListNode": return `ListNode p${i} = makeList(br.readLine());`;
        case "CycleList": return `ListNode p${i} = makeCycle(br.readLine());`;
        case "TreeNode": return `TreeNode p${i} = makeTree(br.readLine());`;
        default: return `String[] t${i} = br.readLine().trim().split("\\\\s+"); int[] p${i} = new int[Integer.parseInt(t${i}[0])]; for (int j = 0; j < p${i}.length; j++) p${i}[j] = Integer.parseInt(t${i}[j + 1]);`;
      }
    })
    .join("\n            ");
  const call = `sol.${camel(sig.name)}(${sig.params.map((_, i) => `p${i}`).join(", ")})`;
  const fmt = { int: `String.valueOf(${call})`, bool: `String.valueOf(${call})`, "int[]": `fmtInts(${call})`, string: `hexOf(${call})`, ListNode: `fmtList(${call})`, TreeNode: `fmtTree(${call})` }[sig.returns];
  const prefix = `import java.io.*; import java.util.*; ${imports.join(" ")} ${JAVA_CLASSES}`; // always defined: the helper methods below mention them
  const source = String.raw`${prefix}${learner}

public class Main {
${JAVA_HELPERS}    public static void main(String[] args) throws Exception {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int n = Integer.parseInt(br.readLine().trim());
        Solution sol = new Solution();
        for (int i = 0; i < n; i++) {
            ${decl}
            String out;
            try {
                out = ${fmt};
            } catch (Throwable e) {
                out = "ERR:" + e.getClass().getSimpleName();
            }
            System.out.print("\n${marker(nonce)}" + i + ":" + out + "@@\n");
            System.out.flush();
        }
    }
}
`;
  return { source, lineOffset: 0 };
}

// ================================================================== C++
const CPP_STRUCTS = String.raw`struct ListNode {
    int val;
    ListNode* next;
    ListNode() : val(0), next(nullptr) {}
    ListNode(int x) : val(x), next(nullptr) {}
    ListNode(int x, ListNode* n) : val(x), next(n) {}
};
struct TreeNode {
    int val;
    TreeNode* left;
    TreeNode* right;
    TreeNode() : val(0), left(nullptr), right(nullptr) {}
    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
    TreeNode(int x, TreeNode* l, TreeNode* r) : val(x), left(l), right(r) {}
};
`;

const CPP_HELPERS = String.raw`static string hexDecode(const string& h) {
    string s;
    for (size_t i = 0; i + 1 < h.size(); i += 2) s.push_back((char) stoi(h.substr(i, 2), nullptr, 16));
    return s;
}
static string hexEncode(const string& s) {
    static const char* digits = "0123456789abcdef";
    string out;
    for (unsigned char c : s) { out.push_back(digits[c >> 4]); out.push_back(digits[c & 15]); }
    return out;
}
static string trim(const string& s) {
    size_t a = s.find_first_not_of(" \t\r\n");
    if (a == string::npos) return "";
    size_t b = s.find_last_not_of(" \t\r\n");
    return s.substr(a, b - a + 1);
}
static vector<vector<int>> parseMatrix(const string& line) {
    istringstream ss(line);
    int r;
    ss >> r;
    vector<vector<int>> m(r);
    for (int i = 0; i < r; i++) {
        int c;
        ss >> c;
        m[i].resize(c);
        for (int j = 0; j < c; j++) ss >> m[i][j];
    }
    return m;
}
static ListNode* makeList(const string& line) {
    istringstream ss(line);
    int n;
    ss >> n;
    vector<int> v(n);
    for (int i = 0; i < n; i++) ss >> v[i];
    ListNode* head = nullptr;
    for (int i = n - 1; i >= 0; i--) head = new ListNode(v[i], head);
    return head;
}
static ListNode* makeCycle(const string& line) {
    istringstream ss(line);
    int n;
    ss >> n;
    if (n == 0) return nullptr;
    vector<ListNode*> nodes(n);
    for (int i = 0; i < n; i++) { int x; ss >> x; nodes[i] = new ListNode(x); }
    for (int i = 0; i + 1 < n; i++) nodes[i]->next = nodes[i + 1];
    int pos;
    ss >> pos;
    if (pos >= 0) nodes[n - 1]->next = nodes[pos];
    return nodes[0];
}
static TreeNode* makeTree(const string& line) {
    istringstream ss(line);
    int n;
    ss >> n;
    vector<string> t(n);
    for (int i = 0; i < n; i++) ss >> t[i];
    if (n == 0 || t[0] == "N") return nullptr;
    TreeNode* root = new TreeNode(stoi(t[0]));
    queue<TreeNode*> q;
    q.push(root);
    int i = 1;
    while (!q.empty() && i < n) {
        TreeNode* node = q.front();
        q.pop();
        if (t[i] != "N") { node->left = new TreeNode(stoi(t[i])); q.push(node->left); }
        i++;
        if (i < n) {
            if (t[i] != "N") { node->right = new TreeNode(stoi(t[i])); q.push(node->right); }
            i++;
        }
    }
    return root;
}
static string fmtVec(const vector<int>& a) {
    string s = to_string(a.size());
    for (int x : a) s += " " + to_string(x);
    return s;
}
static string fmtList(ListNode* head) {
    string body;
    int n = 0;
    while (head != nullptr) {
        body += " " + to_string(head->val);
        head = head->next;
        if (++n > 300000) throw runtime_error("Cycle");
    }
    return to_string(n) + body;
}
static string fmtTree(TreeNode* root) {
    if (root == nullptr) return "0";
    vector<TreeNode*> queue = {root};
    vector<string> out;
    for (size_t qi = 0; qi < queue.size(); qi++) {
        TreeNode* node = queue[qi];
        if (node == nullptr) out.push_back("N");
        else { out.push_back(to_string(node->val)); queue.push_back(node->left); queue.push_back(node->right); }
        if (queue.size() > 600000) throw runtime_error("Cycle");
    }
    while (!out.empty() && out.back() == "N") out.pop_back();
    string s = to_string(out.size());
    for (auto& x : out) s += " " + x;
    return s;
}
`;

function cppSource(code, sig, nonce) {
  const decl = sig.params
    .map((p, i) => {
      switch (p.type) {
        case "int": return `getline(cin, line); int p${i} = stoi(line);`;
        case "string": return `getline(cin, line); string p${i} = hexDecode(trim(line));`;
        case "int[][]": return `getline(cin, line); vector<vector<int>> p${i} = parseMatrix(line);`;
        case "ListNode": return `getline(cin, line); ListNode* p${i} = makeList(line);`;
        case "CycleList": return `getline(cin, line); ListNode* p${i} = makeCycle(line);`;
        case "TreeNode": return `getline(cin, line); TreeNode* p${i} = makeTree(line);`;
        default: return `getline(cin, line); istringstream ss${i}(line); int c${i}; ss${i} >> c${i}; vector<int> p${i}(c${i}); for (int j = 0; j < c${i}; j++) ss${i} >> p${i}[j];`;
      }
    })
    .join("\n        ");
  const call = `${sig.name}(${sig.params.map((_, i) => `p${i}`).join(", ")})`;
  const fmt = { int: "to_string((long long) r)", bool: '(r ? "true" : "false")', "int[]": "fmtVec(r)", string: "hexEncode(r)", ListNode: "fmtList(r)", TreeNode: "fmtTree(r)" }[sig.returns];
  const source = String.raw`#include <bits/stdc++.h>
using namespace std;
${CPP_STRUCTS}#line 1
${code}

${CPP_HELPERS}int main() {
    string line;
    getline(cin, line);
    int n = stoi(line);
    for (int i = 0; i < n; i++) {
        ${decl}
        string out;
        try {
            auto r = ${call};
            out = ${fmt};
        } catch (...) {
            out = "ERR:exception";
        }
        cout << "\n${marker(nonce)}" << i << ":" << out << "@@\n" << flush;
    }
    return 0;
}
`;
  return { source, lineOffset: 0 };
}

const BUILDERS = { python: pythonSource, javascript: javascriptSource, java: javaSource, cpp: cppSource };

/** @returns {{source: string, lineOffset: number}} lineOffset = lines added before the learner's code (Python only) */
export function buildSource(language, code, signature, nonce) {
  if (!BUILDERS[language]) throw new Error(`unsupported language: ${language}`);
  for (const p of signature.params) if (!PARAM_TYPES.has(p.type)) throw new Error(`unsupported parameter type: ${p.type}`);
  if (!RETURN_TYPES.has(signature.returns)) throw new Error(`unsupported return type: ${signature.returns}`);
  return BUILDERS[language](code.replace(/\r\n/g, "\n"), signature, nonce);
}

export const resultPattern = (nonce) => new RegExp(`@@R${nonce}@@(\\d+):([^@\\n]*)@@`, "g");

// ================================================================== starter code shown in the editor
const CPP_T = { int: "int", bool: "bool", string: "string", "int[]": "vector<int>&", "int[][]": "vector<vector<int>>&", ListNode: "ListNode*", CycleList: "ListNode*", TreeNode: "TreeNode*" };
const JAVA_RET = { int: "int", bool: "boolean", string: "String", "int[]": "int[]", ListNode: "ListNode", TreeNode: "TreeNode" };
const CPP_RET = { int: "int", bool: "bool", string: "string", "int[]": "vector<int>", ListNode: "ListNode*", TreeNode: "TreeNode*" };
const JAVA_DEFAULT = { int: "0", bool: "false", string: '""', "int[]": "new int[0]", ListNode: "null", TreeNode: "null" };
const CPP_DEFAULT = { int: "0", bool: "false", string: '""', "int[]": "{}", ListNode: "nullptr", TreeNode: "nullptr" };

function nodeNote(sig, language) {
  const used = new Set([...sig.params.map((p) => p.type), sig.returns]);
  const list = used.has("ListNode") || used.has("CycleList");
  const tree = used.has("TreeNode");
  if (!list && !tree) return "";
  const c = language === "python" ? "#" : "//";
  const lines = [];
  if (language === "python") {
    if (list) lines.push("ListNode(val=0, next=None) is already defined");
    if (tree) lines.push("TreeNode(val=0, left=None, right=None) is already defined");
  } else if (language === "javascript") {
    if (list) lines.push("ListNode(val, next) is already defined (fields: val, next)");
    if (tree) lines.push("TreeNode(val, left, right) is already defined (fields: val, left, right)");
  } else if (language === "java") {
    if (list) lines.push("class ListNode { int val; ListNode next; } is already defined");
    if (tree) lines.push("class TreeNode { int val; TreeNode left, right; } is already defined");
  } else {
    if (list) lines.push("struct ListNode { int val; ListNode* next; } is already defined");
    if (tree) lines.push("struct TreeNode { int val; TreeNode* left; TreeNode* right; } is already defined");
  }
  return lines.map((l) => `${c} ${l}\n`).join("");
}

export function starterCode(language, sig) {
  const note = nodeNote(sig, language);
  if (language === "python") {
    return `${note}def ${sig.name}(${sig.params.map((p) => p.name).join(", ")}):\n    # write your solution here\n    pass\n`;
  }
  if (language === "javascript") {
    return `${note}function ${camel(sig.name)}(${sig.params.map((p) => camel(p.name)).join(", ")}) {\n  // write your solution here\n}\n`;
  }
  if (language === "java") {
    const params = sig.params.map((p) => `${JAVA_T[p.type]} ${camel(p.name)}`).join(", ");
    return `// java.util.* is already imported\n${note}class Solution {\n    public ${JAVA_RET[sig.returns]} ${camel(sig.name)}(${params}) {\n        // write your solution here\n        return ${JAVA_DEFAULT[sig.returns]};\n    }\n}\n`;
  }
  const params = sig.params.map((p) => `${CPP_T[p.type]} ${p.name}`).join(", ");
  return `// <bits/stdc++.h> and "using namespace std;" are already included\n${note}${CPP_RET[sig.returns]} ${sig.name}(${params}) {\n    // write your solution here\n    return ${CPP_DEFAULT[sig.returns]};\n}\n`;
}
