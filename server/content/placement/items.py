# The placement quiz question bank: 3 questions per topic (level 1 easy, 2 medium, 3 hard) = 48.
# Written for this project (own wording and own code snippets). Run `npm run content:placement` to check and load them.
#
# Two kinds:
#   mcq   a short concept question                       (the correct option is written by hand: have a human read these)
#   trace a Python snippet and "what does it print?"      (the build RUNS the code and checks that the correct option is
#                                                          exactly what it prints, and that no other option is)
# Every question has 4 options. `answer` is the index (0-3) of the correct one in `options`: the server shuffles the
# options for each learner, so the position written here does not matter.
# The code is always shown in Python, whatever language the learner practises in.

ITEMS = [
    # ------------------------------------------------------------------ arrays
    dict(concept="arrays", level=1, kind="mcq",
         prompt="A list holds the values 10, 20, 30, 40. Which operation takes the same time however long the list is?",
         options=["Reading the value at position 2", "Searching for the value 30", "Inserting a new value at the front", "Removing the value 20"],
         answer=0,
         explain="Reading by position jumps straight to the place (constant time). The other three scan the list or shift the values after them."),
    dict(concept="arrays", level=2, kind="trace",
         code="""a = [4, 1, 3]
b = a
b.append(9)
a[0] = 7
print(a, b)""",
         options=["[4, 1, 3] [4, 1, 3, 9]", "[7, 1, 3, 9] [7, 1, 3, 9]", "[7, 1, 3] [7, 1, 3, 9]", "[4, 1, 3, 9] [7, 1, 3, 9]"],
         answer=1,
         explain="b = a does not copy the list: both names point at the same list, so a change through either name shows through both."),
    dict(concept="arrays", level=3, kind="trace",
         code="""a = [1, 2, 3, 4, 5]
a[1:4] = [9]
a.insert(1, 8)
print(a, len(a))""",
         options=["[1, 8, 9, 5] 4", "[1, 9, 8, 5] 4", "[1, 8, 9, 4, 5] 5", "[1, 9, 5, 8] 4"],
         answer=0,
         explain="The slice a[1:4] (the values 2, 3, 4) is replaced by the single value 9, giving [1, 9, 5]. Inserting 8 at position 1 gives [1, 8, 9, 5]."),

    # ------------------------------------------------------------------ strings
    dict(concept="strings", level=1, kind="mcq",
         prompt='In Python, what happens when you run  s = "cat"  and then  s[0] = "b" ?',
         options=['s becomes "bat"', "It raises an error: strings cannot be changed in place", "Nothing happens, silently", 's stays "cat" and a new string "bat" is created'],
         answer=1,
         explain="Python strings are immutable. To get \"bat\" you build a new string, for example \"b\" + s[1:]."),
    dict(concept="strings", level=2, kind="trace",
         code="""s = "banana"
print(s.count("an"), s.find("na"), s[1:4])""",
         options=["2 2 ana", "3 2 ana", "2 1 nan", "2 2 nan"],
         answer=0,
         explain='"an" appears twice without overlapping (positions 1 and 3). "na" is first found at position 2. s[1:4] takes positions 1, 2 and 3: "ana".'),
    dict(concept="strings", level=3, kind="trace",
         code="""def f(s):
    out = []
    for ch in s:
        if out and out[-1] == ch:
            out.pop()
        else:
            out.append(ch)
    return "".join(out)

print(f("abbaca"), f("azxxzy"))""",
         options=["ca ay", "ca azy", "aaca ay", "ca y"],
         answer=0,
         explain="Equal neighbours cancel, and the cancelling can chain: in abbaca the b's cancel, then the a's next to them cancel, leaving ca. In azxxzy the x's cancel, then the z's, leaving ay."),

    # ------------------------------------------------------------------ hashing
    dict(concept="hashing", level=1, kind="mcq",
         prompt="Why use a dictionary (hash map) instead of a list when you look values up by key?",
         options=["Looking up a key takes about the same time however many items it holds", "It keeps the keys in sorted order", "It always uses less memory than a list", "It allows the same key to appear twice"],
         answer=0,
         explain="A hash map jumps to where a key should be, so a lookup does not grow with the number of items (on average). It does not sort keys and each key appears once."),
    dict(concept="hashing", level=2, kind="trace",
         code="""words = ["eat", "tea", "tan", "ate", "nat"]
groups = {}
for w in words:
    key = "".join(sorted(w))
    groups.setdefault(key, []).append(w)
print(len(groups), groups["aet"])""",
         options=["2 ['eat', 'tea', 'ate']", "3 ['eat', 'tea', 'ate']", "2 ['eat', 'tea']", "5 ['eat']"],
         answer=0,
         explain='Sorting the letters gives the same key for anagrams: "aet" for eat, tea and ate, and "ant" for tan and nat. So there are 2 groups.'),
    dict(concept="hashing", level=3, kind="trace",
         code="""nums = [1, 2, 3, -3, 3]
seen = {0: 1}
total = 0
count = 0
for x in nums:
    total += x
    count += seen.get(total - 3, 0)
    seen[total] = seen.get(total, 0) + 1
print(count)""",
         options=["5", "4", "3", "6"],
         answer=0,
         explain="It counts the stretches of the list that add up to 3, using running totals: a stretch ends here with sum 3 exactly when an earlier running total equals (total - 3). The five stretches are [1,2], [3], [1,2,3,-3], [3,-3,3] and the last [3]."),

    # ------------------------------------------------------------------ two pointers
    dict(concept="two_pointers", level=1, kind="mcq",
         prompt="A sorted list is given. You want to know if two of its values add up to a target. Which approach needs one pass and no extra memory?",
         options=["Put one pointer at each end and move them inward", "Put every value into a set first", "Try every pair with two nested loops", "Sort the list again"],
         answer=0,
         explain="If the pair is too small move the left pointer right, if too big move the right pointer left. Each step discards a value, so it is one pass."),
    dict(concept="two_pointers", level=2, kind="trace",
         code="""a = [1, 2, 4, 7, 11, 15]
lo, hi = 0, len(a) - 1
steps = 0
while lo < hi:
    s = a[lo] + a[hi]
    steps += 1
    if s == 15:
        break
    if s < 15:
        lo += 1
    else:
        hi -= 1
print(lo, hi, steps)""",
         options=["2 4 4", "2 4 3", "3 4 4", "1 4 4"],
         answer=0,
         explain="1+15=16 is too big (hi moves), 1+11=12 too small (lo moves), 2+11=13 too small (lo moves), 4+11=15 found on the 4th step with lo=2 and hi=4."),
    dict(concept="two_pointers", level=3, kind="trace",
         code="""a = [0, 0, 1, 1, 1, 2, 2, 3]
w = 1
for r in range(1, len(a)):
    if a[r] != a[w - 1]:
        a[w] = a[r]
        w += 1
print(w, a[:w])""",
         options=["4 [0, 1, 2, 3]", "4 [0, 1, 1, 2]", "5 [0, 1, 2, 2, 3]", "3 [0, 1, 2]"],
         answer=0,
         explain="The write pointer w keeps the next free place for a new distinct value, the read pointer r scans. The distinct values 0, 1, 2, 3 end up in front, so w is 4."),

    # ------------------------------------------------------------------ sorting
    dict(concept="sorting", level=1, kind="mcq",
         prompt="Which statement about sorting n items with a comparison-based method such as merge sort is correct?",
         options=["It needs on the order of n log n comparisons in the worst case", "It can always be done with only n comparisons", "Every method needs about n squared comparisons", "It is fastest when the list is in reverse order"],
         answer=0,
         explain="Merge sort does about n log n comparisons, and no comparison-based method can do better in the worst case. n squared is only for simple methods such as insertion sort."),
    dict(concept="sorting", level=2, kind="trace",
         code="""people = [("Ann", 30), ("Bob", 25), ("Cy", 30), ("Di", 25)]
people.sort(key=lambda p: p[1])
print([p[0] for p in people])""",
         options=["['Bob', 'Di', 'Ann', 'Cy']", "['Di', 'Bob', 'Cy', 'Ann']", "['Ann', 'Cy', 'Bob', 'Di']", "['Bob', 'Di', 'Cy', 'Ann']"],
         answer=0,
         explain="Python's sort is stable: people with equal keys keep their original order. Ages 25 come first (Bob then Di), then ages 30 (Ann then Cy)."),
    dict(concept="sorting", level=3, kind="trace",
         code="""a = [3, 1, 2, 5, 4]
moves = 0
for i in range(1, len(a)):
    j = i
    while j > 0 and a[j - 1] > a[j]:
        a[j - 1], a[j] = a[j], a[j - 1]
        moves += 1
        j -= 1
print(moves, a)""",
         options=["3 [1, 2, 3, 4, 5]", "4 [1, 2, 3, 4, 5]", "2 [1, 2, 3, 4, 5]", "3 [1, 2, 3, 5, 4]"],
         answer=0,
         explain="Each swap fixes exactly one out-of-order pair, so the number of swaps equals the number of such pairs: (3,1), (3,2) and (5,4) = 3."),

    # ------------------------------------------------------------------ sliding window
    dict(concept="sliding_window", level=1, kind="mcq",
         prompt="What is a 'sliding window' on a list?",
         options=["A range of neighbouring values whose two ends move forward as you scan", "A way to sort the list in place", "A hash table that forgets its oldest keys", "A recursion that splits the list in half"],
         answer=0,
         explain="The window is a stretch of neighbouring values. When it slides you add the new value at one end and drop the old one at the other, instead of recomputing from scratch."),
    dict(concept="sliding_window", level=2, kind="trace",
         code="""a = [2, 1, 5, 1, 3, 2]
k = 3
cur = sum(a[:k])
best = cur
for i in range(k, len(a)):
    cur += a[i] - a[i - k]
    best = max(best, cur)
print(best)""",
         options=["9", "8", "10", "7"],
         answer=0,
         explain="The windows of three have sums 8, 7, 9 and 6. The largest is 9, from [5, 1, 3]."),
    dict(concept="sliding_window", level=3, kind="trace",
         code="""s = "abcabcbb"
last = {}
start = 0
best = 0
for i, ch in enumerate(s):
    if ch in last and last[ch] >= start:
        start = last[ch] + 1
    last[ch] = i
    best = max(best, i - start + 1)
print(best, start)""",
         options=["3 7", "3 5", "4 7", "3 6"],
         answer=0,
         explain="start jumps just past the previous copy of a repeated letter. The longest stretch without a repeat is 3 (for example abc), and after the last letter start has reached 7."),

    # ------------------------------------------------------------------ stacks and queues
    dict(concept="stack_queue", level=1, kind="mcq",
         prompt="Which pair correctly names the order in which a stack and a queue give items back?",
         options=["Stack: last in, first out. Queue: first in, first out", "Stack: first in, first out. Queue: last in, first out", "Both give back the largest item first", "Both give back items in sorted order"],
         answer=0,
         explain="A stack is like a pile of plates (the last plate put on is the first taken off). A queue is like a line of people (the first to arrive is served first)."),
    dict(concept="stack_queue", level=2, kind="trace",
         code="""from collections import deque
stack = [1, 2, 3]
queue = deque([4, 5])
queue.append(stack.pop())
stack.append(queue.popleft())
print(stack, list(queue))""",
         options=["[1, 2, 4] [5, 3]", "[1, 2, 5] [4, 3]", "[1, 2, 4] [3, 5]", "[1, 2, 3] [5, 4]"],
         answer=0,
         explain="stack.pop() takes 3 off the top and queue.append puts it at the back: queue is [4, 5, 3]. queue.popleft() takes 4 from the front and pushes it on the stack: [1, 2, 4], with [5, 3] left."),
    dict(concept="stack_queue", level=3, kind="trace",
         code="""temps = [73, 74, 75, 71, 69, 72, 76, 73]
ans = [0] * len(temps)
st = []
for i, t in enumerate(temps):
    while st and temps[st[-1]] < t:
        j = st.pop()
        ans[j] = i - j
    st.append(i)
print(ans)""",
         options=["[1, 1, 4, 2, 1, 1, 0, 0]", "[1, 1, 4, 2, 1, 1, 1, 0]", "[1, 1, 3, 2, 1, 1, 0, 0]", "[1, 2, 4, 2, 1, 1, 0, 0]"],
         answer=0,
         explain="The stack holds the days still waiting for a warmer day. Each new temperature settles every waiting day that is colder than it, and the answer for that day is how many days it waited. For example the 74 on day 1 waits 1 day for the 75, while the 75 on day 2 waits 4 days for the 76 on day 6."),

    # ------------------------------------------------------------------ linked lists
    dict(concept="linked_list", level=1, kind="mcq",
         prompt="Why is adding a node at the front of a singly linked list fast?",
         options=["Only a couple of links change; nothing has to be shifted", "Because the list is kept sorted", "Because all nodes sit in one block of memory", "Because every node stores the length of the list"],
         answer=0,
         explain="The new node points at the old first node and becomes the head. Unlike a plain array, no other value has to move."),
    dict(concept="linked_list", level=2, kind="trace",
         code="""class Node:
    def __init__(self, v, nxt=None):
        self.v, self.nxt = v, nxt

head = Node(1, Node(2, Node(3)))
prev = None
cur = head
while cur:
    cur.nxt, prev, cur = prev, cur, cur.nxt
out = []
while prev:
    out.append(prev.v)
    prev = prev.nxt
print(out)""",
         options=["[3, 2, 1]", "[1, 2, 3]", "[3]", "[1]"],
         answer=0,
         explain="Each step turns the current node's link around to point at the previous node, then moves on. When it finishes, prev is the old last node, so the list reads 3, 2, 1."),
    dict(concept="linked_list", level=3, kind="trace",
         code="""class Node:
    def __init__(self, v):
        self.v, self.nxt = v, None

nodes = [Node(i) for i in range(1, 8)]
for a, b in zip(nodes, nodes[1:]):
    a.nxt = b
nodes[6].nxt = nodes[2]
slow = fast = nodes[0]
steps = 0
while fast and fast.nxt:
    slow = slow.nxt
    fast = fast.nxt.nxt
    steps += 1
    if slow is fast:
        break
print(slow.v, steps)""",
         options=["6 5", "5 4", "7 6", "3 2"],
         answer=0,
         explain="The last node points back to node 3, so there is a cycle (3-4-5-6-7). The fast pointer moves two steps for each one of the slow pointer and catches it inside the cycle, at node 6 after 5 steps."),

    # ------------------------------------------------------------------ recursion
    dict(concept="recursion", level=1, kind="mcq",
         prompt="What must every correct recursive function have?",
         options=["A base case that stops the recursion", "A loop inside it", "A global variable that counts the calls", "A list as its return value"],
         answer=0,
         explain="Without a base case the function calls itself forever (until the stack overflows). Loops, counters and lists are optional."),
    dict(concept="recursion", level=2, kind="trace",
         code="""def f(n):
    if n <= 1:
        return 1
    return f(n - 1) + f(n - 2)

print(f(5), f(6))""",
         options=["8 13", "5 8", "13 21", "8 21"],
         answer=0,
         explain="f(1)=1, f(2)=2, f(3)=3, f(4)=5, f(5)=8, f(6)=13: each value is the sum of the two before it."),
    dict(concept="recursion", level=3, kind="trace",
         code="""def g(n):
    if n == 0:
        return []
    return g(n - 1) + [n] + g(n - 1)

print(g(3))""",
         options=["[1, 2, 1, 3, 1, 2, 1]", "[1, 2, 3, 2, 1]", "[3, 2, 1, 1, 2, 3]", "[1, 2, 3, 1, 2, 3, 1]"],
         answer=0,
         explain="g(1) = [1]. g(2) = g(1) + [2] + g(1) = [1, 2, 1]. g(3) = [1, 2, 1] + [3] + [1, 2, 1]."),

    # ------------------------------------------------------------------ binary search
    dict(concept="binary_search", level=1, kind="mcq",
         prompt="What must be true of the data for binary search to work?",
         options=["It is sorted", "All values are different", "It is stored in a linked list", "It is small enough to fit in the CPU cache"],
         answer=0,
         explain="Binary search compares with the middle value and throws away the half that cannot contain the answer. That only works if the values are in order."),
    dict(concept="binary_search", level=2, kind="trace",
         code="""a = [1, 3, 5, 7, 9, 11]
lo, hi = 0, len(a) - 1
x = 7
count = 0
while lo <= hi:
    mid = (lo + hi) // 2
    count += 1
    if a[mid] == x:
        break
    if a[mid] < x:
        lo = mid + 1
    else:
        hi = mid - 1
print(mid, count)""",
         options=["3 3", "3 2", "4 2", "2 3"],
         answer=0,
         explain="The middles checked are position 2 (value 5, too small), position 4 (value 9, too big) and position 3 (value 7, found): 3 looks."),
    dict(concept="binary_search", level=3, kind="trace",
         code="""a = [1, 2, 2, 2, 3, 5]
lo, hi = 0, len(a)
while lo < hi:
    mid = (lo + hi) // 2
    if a[mid] < 2:
        lo = mid + 1
    else:
        hi = mid
first = lo
lo, hi = 0, len(a)
while lo < hi:
    mid = (lo + hi) // 2
    if a[mid] <= 2:
        lo = mid + 1
    else:
        hi = mid
print(first, lo)""",
         options=["1 4", "1 3", "2 4", "0 4"],
         answer=0,
         explain="The first loop finds the first position whose value is at least 2 (position 1). The second finds the first position whose value is greater than 2 (position 4), just after the last 2."),

    # ------------------------------------------------------------------ trees
    dict(concept="trees", level=1, kind="mcq",
         prompt="In a binary search tree, where are all the values smaller than a node's value?",
         options=["In its left subtree", "In its right subtree", "Only in its parent", "Anywhere in the tree"],
         answer=0,
         explain="That is the defining rule: smaller values go left, larger values go right, at every node."),
    dict(concept="trees", level=2, kind="trace",
         code="""class T:
    def __init__(self, v):
        self.v, self.l, self.r = v, None, None

def insert(t, v):
    if not t:
        return T(v)
    if v < t.v:
        t.l = insert(t.l, v)
    else:
        t.r = insert(t.r, v)
    return t

def inorder(t):
    return inorder(t.l) + [t.v] + inorder(t.r) if t else []

def height(t):
    return 1 + max(height(t.l), height(t.r)) if t else 0

root = None
for v in [5, 2, 8, 1, 3]:
    root = insert(root, v)
print(inorder(root), height(root))""",
         options=["[1, 2, 3, 5, 8] 3", "[1, 2, 3, 5, 8] 2", "[5, 2, 1, 3, 8] 3", "[1, 2, 3, 5, 8] 5"],
         answer=0,
         explain="Reading a search tree left, node, right (in-order) always gives the values in sorted order. The longest path is 5, 2, 1 (or 3): 3 nodes."),
    dict(concept="trees", level=3, kind="trace",
         code="""from collections import deque

class T:
    def __init__(self, v, l=None, r=None):
        self.v, self.l, self.r = v, l, r

root = T(1, T(2, None, T(5)), T(3, None, T(4)))
q = deque([root])
view = []
while q:
    for i in range(len(q)):
        node = q.popleft()
        if i == 0:
            view.append(node.v)
        if node.r:
            q.append(node.r)
        if node.l:
            q.append(node.l)
print(view)""",
         options=["[1, 3, 4]", "[1, 2, 5]", "[1, 3, 5]", "[1, 2, 3, 4, 5]"],
         answer=0,
         explain="It walks the tree level by level, adding the right child first, and records the first node of each level: that is the rightmost node of each level, 1, then 3, then 4."),

    # ------------------------------------------------------------------ heaps
    dict(concept="heaps", level=1, kind="mcq",
         prompt="What does a min-heap guarantee?",
         options=["The smallest item is always at the top and can be read at once", "All items are kept in fully sorted order", "Any value can be found in constant time", "Items stay in the order they were added"],
         answer=0,
         explain="A heap only keeps the top item correct, which makes adding and removing the smallest fast. The rest is only partly ordered."),
    dict(concept="heaps", level=2, kind="trace",
         code="""import heapq
h = []
for x in [5, 3, 8, 1, 9, 2]:
    heapq.heappush(h, x)
print(heapq.heappop(h), heapq.heappop(h), h[0])""",
         options=["1 2 3", "1 2 5", "1 3 2", "9 8 5"],
         answer=0,
         explain="heappop always removes the smallest item: first 1, then 2. The smallest of what is left (3, 5, 8, 9) is 3."),
    dict(concept="heaps", level=3, kind="trace",
         code="""import heapq
k = 3
h = []
for x in [4, 9, 1, 7, 3, 8, 6]:
    heapq.heappush(h, x)
    if len(h) > k:
        heapq.heappop(h)
print(sorted(h), h[0])""",
         options=["[7, 8, 9] 7", "[1, 3, 4] 1", "[7, 8, 9] 9", "[6, 7, 8] 6"],
         answer=0,
         explain="Whenever the heap holds more than 3 items the smallest is thrown out, so it ends up holding the 3 largest values: 7, 8 and 9. The top of a min-heap is the smallest of them, 7."),

    # ------------------------------------------------------------------ graphs
    dict(concept="graphs", level=1, kind="mcq",
         prompt="After the start node, what does breadth-first search (BFS) visit first?",
         options=["All of the start node's direct neighbours", "One neighbour, then its neighbour, as deep as it can go", "The node with the most edges", "The node with the smallest label"],
         answer=0,
         explain="BFS explores in rings: first everything one step from the start, then everything two steps away, and so on. Going as deep as possible first is depth-first search."),
    dict(concept="graphs", level=2, kind="trace",
         code="""from collections import deque
g = {1: [3, 2], 2: [5], 3: [4], 4: [5], 5: []}
seen = {1}
q = deque([1])
order = []
while q:
    u = q.popleft()
    order.append(u)
    for v in g[u]:
        if v not in seen:
            seen.add(v)
            q.append(v)
print(order)""",
         options=["[1, 3, 2, 4, 5]", "[1, 2, 3, 4, 5]", "[1, 3, 4, 5, 2]", "[1, 2, 5, 3, 4]"],
         answer=0,
         explain="From 1 the neighbours are queued in the order 3, 2. So 3 is visited before 2, then 4 (from 3), then 5 (from 2)."),
    dict(concept="graphs", level=3, kind="trace",
         code="""import heapq
g = {"A": [("B", 4), ("C", 1)], "B": [("D", 1)], "C": [("B", 2), ("D", 5)], "D": []}
dist = {"A": 0}
h = [(0, "A")]
while h:
    d, u = heapq.heappop(h)
    if d > dist.get(u, 99):
        continue
    for v, w in g[u]:
        nd = d + w
        if nd < dist.get(v, 99):
            dist[v] = nd
            heapq.heappush(h, (nd, v))
print(dist["B"], dist["D"])""",
         options=["3 4", "4 5", "3 6", "4 4"],
         answer=0,
         explain="This is Dijkstra's shortest-path algorithm. The cheapest way to B is A to C to B (1 + 2 = 3), not the direct road (4). Then D is 3 + 1 = 4 through B, cheaper than 1 + 5 = 6 through C."),

    # ------------------------------------------------------------------ greedy
    dict(concept="greedy", level=1, kind="mcq",
         prompt="What does a greedy algorithm do?",
         options=["It takes the best-looking choice at each step and never reconsiders it", "It tries every possible combination", "It always uses recursion", "It needs the input to be a graph"],
         answer=0,
         explain="Greedy means committing to the locally best choice. It is fast and simple, and it is only correct for problems where that is provably enough."),
    dict(concept="greedy", level=2, kind="trace",
         code="""coins = [25, 10, 5, 1]
n = 63
used = []
for c in coins:
    while n >= c:
        n -= c
        used.append(c)
print(len(used), used.count(1))""",
         options=["6 3", "7 3", "6 2", "5 3"],
         answer=0,
         explain="63 = 25 + 25 + 10 + 1 + 1 + 1: six coins, three of them ones."),
    dict(concept="greedy", level=3, kind="trace",
         code="""coins = [4, 3, 1]
n = 6
used = []
for c in coins:
    while n >= c:
        n -= c
        used.append(c)
print(used, len(used))""",
         options=["[4, 1, 1] 3", "[3, 3] 2", "[4, 1, 1] 2", "[3, 1, 1, 1] 4"],
         answer=0,
         explain="Taking the biggest coin first gives 4 + 1 + 1 (three coins), but 3 + 3 uses only two. For these coin values greedy is not optimal: it only works for some coin systems."),

    # ------------------------------------------------------------------ backtracking
    dict(concept="backtracking", level=1, kind="mcq",
         prompt="Which description fits backtracking?",
         options=["Build a solution step by step and undo a step when it cannot lead to a solution", "Sort the input, then scan it once", "Store the answers of subproblems in a table", "Always pick the cheapest next step"],
         answer=0,
         explain="Backtracking explores choices depth first and goes back (undoes the last choice) when a path fails. Tables are dynamic programming; the cheapest step is greedy."),
    dict(concept="backtracking", level=2, kind="trace",
         code="""def subsets(a):
    out = []
    def go(i, cur):
        if i == len(a):
            out.append(cur[:])
            return
        go(i + 1, cur)
        cur.append(a[i])
        go(i + 1, cur)
        cur.pop()
    go(0, [])
    return out

print(subsets([1, 2]))""",
         options=["[[], [2], [1], [1, 2]]", "[[], [1], [2], [1, 2]]", "[[1, 2], [1], [2], []]", "[[], [1], [1, 2], [2]]"],
         answer=0,
         explain="At each position the code first tries without the value, then with it. Following the calls: [] then [2] (value 1 left out), then [1] then [1, 2] (value 1 taken)."),
    dict(concept="backtracking", level=3, kind="trace",
         code="""def solve(n):
    cols, d1, d2 = set(), set(), set()
    def go(r):
        if r == n:
            return 1
        total = 0
        for c in range(n):
            if c in cols or r - c in d1 or r + c in d2:
                continue
            cols.add(c); d1.add(r - c); d2.add(r + c)
            total += go(r + 1)
            cols.remove(c); d1.remove(r - c); d2.remove(r + c)
        return total
    return go(0)

print(solve(4), solve(5), solve(6))""",
         options=["2 10 4", "2 8 4", "4 10 2", "2 10 6"],
         answer=0,
         explain="This counts the ways to place n queens on an n by n board so that none attack each other. The known counts are 2 for n=4, 10 for n=5 and 4 for n=6."),

    # ------------------------------------------------------------------ dynamic programming
    dict(concept="dp", level=1, kind="mcq",
         prompt="When does dynamic programming help most?",
         options=["When the same smaller subproblems come up again and again, so their answers can be stored and reused", "When the input is already sorted", "When the problem has only one possible answer", "When the data is a graph with negative edges"],
         answer=0,
         explain="Dynamic programming avoids repeated work by remembering answers to overlapping subproblems (in a table or a cache)."),
    dict(concept="dp", level=2, kind="trace",
         code="""n = 6
dp = [1, 1] + [0] * (n - 1)
for i in range(2, n + 1):
    dp[i] = dp[i - 1] + dp[i - 2]
print(dp)""",
         options=["[1, 1, 2, 3, 5, 8, 13]", "[1, 1, 2, 4, 8, 16, 32]", "[0, 1, 1, 2, 3, 5, 8]", "[1, 2, 3, 5, 8, 13, 21]"],
         answer=0,
         explain="Each entry is the sum of the two before it, starting from 1 and 1: 1, 1, 2, 3, 5, 8, 13. The list has n + 1 = 7 entries."),
    dict(concept="dp", level=3, kind="trace",
         code="""coins = [1, 3, 4]
n = 6
INF = 99
dp = [0] + [INF] * n
for a in range(1, n + 1):
    for c in coins:
        if c <= a:
            dp[a] = min(dp[a], dp[a - c] + 1)
print(dp)""",
         options=["[0, 1, 2, 1, 1, 2, 2]", "[0, 1, 2, 3, 1, 2, 3]", "[0, 1, 2, 1, 1, 2, 3]", "[0, 1, 2, 1, 2, 2, 2]"],
         answer=0,
         explain="dp[a] is the fewest coins that make the amount a. For example dp[6] = 2 (3 + 3), better than the greedy 4 + 1 + 1. dp[5] = 2 (4 + 1) and dp[4] = 1."),
]
