// Checks every parameter/return type of the harness in all four languages (needs Judge0, no database).
// Run: npm run test:harness-types
import { gradeCode } from "../src/grader.js";

const sig = (name, params, returns) => ({ name, params: params.map(([n, type]) => ({ name: n, type })), returns });
const T = (...rows) => rows.map(([args, expected], idx) => ({ idx, args, expected }));

const CASES = [
  {
    label: "int[] -> int[]", sig: sig("echo_ints", [["values", "int[]"]], "int[]"),
    tests: T([[[1, 2, 3]], [1, 2, 3]], [[[]], []], [[[-5]], [-5]]),
    code: {
      python: "def echo_ints(values):\n    return values\n",
      javascript: "function echoInts(values) { return values; }\n",
      java: "class Solution { public int[] echoInts(int[] values) { return values; } }\n",
      cpp: "vector<int> echo_ints(vector<int>& values) { return values; }\n",
    },
  },
  {
    label: "string -> string", sig: sig("echo_text", [["text", "string"]], "string"),
    tests: T([["hello world"], "hello world"], [[""], ""], [["Ab, c!"], "Ab, c!"], [["café"], "café"]),
    code: {
      python: "def echo_text(text):\n    return text\n",
      javascript: "function echoText(text) { return text; }\n",
      java: "class Solution { public String echoText(String text) { return text; } }\n",
      cpp: "string echo_text(string text) { return text; }\n",
    },
  },
  {
    label: "ListNode -> ListNode (reverse)", sig: sig("reverse_list", [["head", "ListNode"]], "ListNode"),
    tests: T([[[1, 2, 3]], [3, 2, 1]], [[[]], []], [[[7]], [7]], [[[1, 2]], [2, 1]]),
    code: {
      python: "def reverse_list(head):\n    prev = None\n    while head:\n        head.next, prev, head = prev, head, head.next\n    return prev\n",
      javascript: "function reverseList(head) { let prev = null; while (head) { const nx = head.next; head.next = prev; prev = head; head = nx; } return prev; }\n",
      java: "class Solution { public ListNode reverseList(ListNode head) { ListNode prev = null; while (head != null) { ListNode nx = head.next; head.next = prev; prev = head; head = nx; } return prev; } }\n",
      cpp: "ListNode* reverse_list(ListNode* head) { ListNode* prev = nullptr; while (head) { ListNode* nx = head->next; head->next = prev; prev = head; head = nx; } return prev; }\n",
    },
  },
  {
    label: "TreeNode -> TreeNode (mirror, with missing children)", sig: sig("mirror_tree", [["root", "TreeNode"]], "TreeNode"),
    tests: T([[[1, 2, 3]], [1, 3, 2]], [[[1, null, 2, 3]], [1, 2, null, null, 3]], [[[]], []], [[[5]], [5]], [[[1, 2, null, 4]], [1, null, 2, null, 4]]),
    code: {
      python: "def mirror_tree(root):\n    if root is None:\n        return None\n    root.left, root.right = mirror_tree(root.right), mirror_tree(root.left)\n    return root\n",
      javascript: "function mirrorTree(root) { if (root === null) return null; const l = mirrorTree(root.left), r = mirrorTree(root.right); root.left = r; root.right = l; return root; }\n",
      java: "class Solution { public TreeNode mirrorTree(TreeNode root) { if (root == null) return null; TreeNode l = mirrorTree(root.left), r = mirrorTree(root.right); root.left = r; root.right = l; return root; } }\n",
      cpp: "TreeNode* mirror_tree(TreeNode* root) { if (!root) return nullptr; TreeNode* l = mirror_tree(root->left); TreeNode* r = mirror_tree(root->right); root->left = r; root->right = l; return root; }\n",
    },
  },
  {
    label: "CycleList -> int (cycle length)", sig: sig("cycle_length", [["head", "CycleList"]], "int"),
    tests: T([[[[1, 2, 3, 4], 1]], 3], [[[[1, 2], -1]], 0], [[[[], -1]], 0], [[[[5], 0]], 1], [[[[1, 2, 3], 0]], 3]),
    code: {
      python: "def cycle_length(head):\n    slow = fast = head\n    while fast and fast.next:\n        slow = slow.next\n        fast = fast.next.next\n        if slow is fast:\n            n, cur = 1, slow.next\n            while cur is not slow:\n                n += 1\n                cur = cur.next\n            return n\n    return 0\n",
      javascript: "function cycleLength(head) { let slow = head, fast = head; while (fast && fast.next) { slow = slow.next; fast = fast.next.next; if (slow === fast) { let n = 1, cur = slow.next; while (cur !== slow) { n++; cur = cur.next; } return n; } } return 0; }\n",
      java: "class Solution { public int cycleLength(ListNode head) { ListNode slow = head, fast = head; while (fast != null && fast.next != null) { slow = slow.next; fast = fast.next.next; if (slow == fast) { int n = 1; ListNode cur = slow.next; while (cur != slow) { n++; cur = cur.next; } return n; } } return 0; } }\n",
      cpp: "int cycle_length(ListNode* head) { ListNode *slow = head, *fast = head; while (fast && fast->next) { slow = slow->next; fast = fast->next->next; if (slow == fast) { int n = 1; ListNode* cur = slow->next; while (cur != slow) { n++; cur = cur->next; } return n; } } return 0; }\n",
    },
  },
  {
    label: "TreeNode + int[][] + ListNode params together", sig: sig("mixed", [["root", "TreeNode"], ["grid", "int[][]"], ["head", "ListNode"], ["k", "int"]], "int"),
    tests: T([[[1, 2, 3], [[1, 2], [3]], [4, 5], 10], 1 + 2 + 3 + 1 + 2 + 3 + 4 + 5 + 10], [[[], [[]], [], 0], 0]),
    code: {
      python: "def mixed(root, grid, head, k):\n    total = k\n    stack = [root] if root else []\n    while stack:\n        n = stack.pop(); total += n.val\n        stack += [c for c in (n.left, n.right) if c]\n    total += sum(sum(r) for r in grid)\n    while head:\n        total += head.val; head = head.next\n    return total\n",
      javascript: "function mixed(root, grid, head, k) { let total = k; const st = root ? [root] : []; while (st.length) { const n = st.pop(); total += n.val; if (n.left) st.push(n.left); if (n.right) st.push(n.right); } for (const r of grid) for (const v of r) total += v; while (head) { total += head.val; head = head.next; } return total; }\n",
      java: "class Solution { public int mixed(TreeNode root, int[][] grid, ListNode head, int k) { int total = k; Deque<TreeNode> st = new ArrayDeque<>(); if (root != null) st.push(root); while (!st.isEmpty()) { TreeNode n = st.pop(); total += n.val; if (n.left != null) st.push(n.left); if (n.right != null) st.push(n.right); } for (int[] r : grid) for (int v : r) total += v; while (head != null) { total += head.val; head = head.next; } return total; } }\n",
      cpp: "int mixed(TreeNode* root, vector<vector<int>>& grid, ListNode* head, int k) { int total = k; vector<TreeNode*> st; if (root) st.push_back(root); while (!st.empty()) { TreeNode* n = st.back(); st.pop_back(); total += n->val; if (n->left) st.push_back(n->left); if (n->right) st.push_back(n->right); } for (auto& r : grid) for (int v : r) total += v; while (head) { total += head->val; head = head->next; } return total; }\n",
    },
  },
];

let failures = 0;
const check = (ok, label, detail = "") => { if (!ok) failures++; console.log(`${ok ? "ok  " : "FAIL"} ${label} ${detail}`); };

for (const c of CASES) {
  for (const [language, code] of Object.entries(c.code)) {
    const r = await gradeCode({ language, code, signature: c.sig, tests: c.tests });
    const passed = r.tests.filter((t) => t.verdict === "passed").length;
    check(r.verdict === "accepted", `${language.padEnd(11)} ${c.label}`, r.verdict === "accepted" ? "" : `-> ${r.verdict} ${passed}/${c.tests.length} ${(r.compileOutput || r.stderr).slice(0, 160)} ${JSON.stringify(r.tests.map((t) => t.actual))}`);
  }
}

// wrong return type is reported, not crashed on; Python line numbers match the learner's editor
const listSig = sig("reverse_list", [["head", "ListNode"]], "ListNode");
let r = await gradeCode({ language: "python", code: "def reverse_list(head):\n    return 5\n", signature: listSig, tests: T([[[1]], [1]]) });
check(r.verdict === "runtime_error" && r.tests[0].actual === "ERR:BadType", "python  returning the wrong type for ListNode -> ERR:BadType", JSON.stringify(r.tests[0]));
r = await gradeCode({ language: "python", code: "def reverse_list(head):\n    x = 1\n    return 1 // 0\n", signature: listSig, tests: T([[[1]], [1]]) });
check(/line 3/.test(r.stderr) || r.tests[0].actual === "ERR:ZeroDivisionError", "python  error line numbers are the learner's own (not shifted by the node classes)", JSON.stringify(r.stderr.slice(0, 80)));
r = await gradeCode({ language: "python", code: "def reverse_list(head)\n    return head\n", signature: listSig, tests: T([[[1]], [1]]) });
check(r.verdict === "compile_error" && /line 1/.test(r.compileOutput), "python  syntax error on line 1 is reported as line 1", JSON.stringify(r.compileOutput.slice(0, 70)));
r = await gradeCode({ language: "java", code: "import java.util.*;\nclass Solution {\n    public ListNode reverseList(ListNode head) {\n        return head;\n    }\n}\n", signature: listSig, tests: T([[[1, 2]], [1, 2]]) });
check(r.verdict === "accepted", "java    learner's own import line is accepted next to the node classes", r.compileOutput?.slice(0, 120));

console.log(failures === 0 ? "\nAll harness type checks passed." : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
