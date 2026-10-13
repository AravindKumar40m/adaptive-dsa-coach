# Proposed skill tags (automatic, needs a human read)

Main concept first with its weight; secondary skills only where there is evidence. Edit `skills.json` to correct anything, then run `npm run content:build && npm run content:seed`.

| problem | skills (weight) | why the extra skills |
|---|---|---|
| ackermann-value | recursion 1.0 | - |
| add-two-digit-lists | linked_list 1.0 | - |
| anagram-window-count | hashing 0.6, strings 0.2, sliding_window 0.2 | strings: input: the problem takes a string; sliding_window: hint: the pattern hint names it |
| asteroid-survivors | stack_queue 1.0 | - |
| backspace-compare | stack_queue 0.7, strings 0.3 | strings: input: the problem takes a string |
| balanced-brackets | stack_queue 0.7, strings 0.3 | strings: input: the problem takes a string |
| balloon-burst-max | dp 1.0 | - |
| baseball-score | stack_queue 0.7, strings 0.3 | strings: input: the problem takes a string |
| best-sightseeing-pair | arrays 1.0 | - |
| best-streak-sum | arrays 1.0 | - |
| best-window | sliding_window 1.0 | - |
| boats-needed | two_pointers 0.7, sorting 0.3 | sorting: code: optimal() sorts the data, hint: the pattern hint names it |
| bouquet-days | binary_search 1.0 | - |
| bst-from-sorted-array | trees 0.7, recursion 0.3 | recursion: code: optimal() has a function (build) that calls itself, hint: the pattern hint names it |
| bst-kth-value | trees 1.0 | - |
| build-tree-from-orders | trees 0.6, recursion 0.2, hashing 0.2 | recursion: code: optimal() has a function (build) that calls itself, hint: the pattern hint names it; hashing: code(weak): optimal() uses a dict / set, hint: the pattern hint names it |
| cables-to-connect-all | graphs 1.0 | - |
| calculator-with-brackets | stack_queue 0.7, strings 0.3 | strings: input: the problem takes a string |
| can-attend-all | sorting 1.0 | - |
| can-finish-courses | graphs 1.0 | - |
| candy-distribution | greedy 1.0 | - |
| cheapest-with-stops | graphs 1.0 | - |
| circular-street-robbery | dp 1.0 | - |
| clean-palindrome | strings 0.7, two_pointers 0.3 | two_pointers: hint: the pattern hint names it |
| climb-with-ladders | heaps 1.0 | - |
| close-neighbour-orders | backtracking 0.7, recursion 0.3 | recursion: code: optimal() has a function (go) that calls itself, hint: the nudge/walkthrough mentions it |
| closest-k-points | heaps 1.0 | - |
| closest-triplet-sum | two_pointers 0.7, sorting 0.3 | sorting: code: optimal() sorts the data, hint: the pattern hint names it |
| combination-sum-count | backtracking 0.6, dp 0.2, recursion 0.2 | dp: code: better() memoizes or fills a dp table, hint: the pattern hint names it; recursion: code: better() has a function (go) that calls itself, hint: the nudge/walkthrough mentions it |
| combination-sum-distinct-count | backtracking 0.6, sorting 0.2, recursion 0.2 | sorting: code: optimal() sorts the data, hint: the pattern hint names it; recursion: code: optimal() has a function (go) that calls itself |
| common-prefix-length | strings 1.0 | - |
| compare-versions | strings 0.7, two_pointers 0.3 | two_pointers: hint: the pattern hint names it |
| compress-string | strings 0.6, hashing 0.2, two_pointers 0.2 | hashing: hint: the pattern hint names it; two_pointers: hint: the pattern hint names it |
| connected-groups | graphs 1.0 | - |
| cookie-match | greedy 0.7, sorting 0.3 | sorting: code: optimal() sorts the data, hint: the pattern hint names it |
| count-good-numbers | recursion 1.0 | - |
| count-inversions | sorting 0.7, recursion 0.3 | recursion: code: optimal() has a function (sort) that calls itself, hint: the nudge/walkthrough mentions it |
| count-of-value | binary_search 1.0 | - |
| count-pairs-with-difference | two_pointers 1.0 | - |
| count-windows-above | sliding_window 1.0 | - |
| critical-link-count | graphs 0.7, recursion 0.3 | recursion: checked by hand 2026-10-13 (hand-corrected: 'trees' came from the words 'search tree' in a hint; it is a graph depth-first search) |
| cycle-length | linked_list 1.0 | - |
| cycle-start-index | linked_list 1.0 | - |
| daily-stock-span | stack_queue 1.0 | - |
| days-until-warmer | stack_queue 1.0 | - |
| decode-nested | stack_queue 0.7, strings 0.3 | strings: input: the problem takes a string |
| decode-ways-count | dp 0.8, strings 0.2 | strings: checked by hand 2026-10-14 (hand-corrected: 'recursion' came from the memoised helper; the intended solution is an iterative table) |
| dedupe-sorted-list | linked_list 1.0 | - |
| deepest-leaves-ancestor | trees 0.7, recursion 0.3 | recursion: code: optimal() has a function (go) that calls itself, hint: the pattern hint names it |
| digit-square-loop | hashing 1.0 | - |
| digital-root-recursive | recursion 1.0 | - |
| distinct-permutations | recursion 0.6, strings 0.2, sorting 0.2 | strings: input: the problem takes a string; sorting: code: better() sorts the data |
| distinct-subsets-count | backtracking 1.0 | - |
| downward-paths-with-sum | trees 0.6, hashing 0.2, recursion 0.2 | hashing: code(weak): optimal() uses a dict / set, hint: the pattern hint names it; recursion: code: optimal() has a function (walk) that calls itself |
| edit-distance | dp 0.6, recursion 0.2, strings 0.2 | recursion: code: better() has a function (go) that calls itself, hint: the nudge/walkthrough mentions it; strings: input: the problem takes a string |
| enclosed-land-count | graphs 1.0 | - |
| equal-sum-split | dp 1.0 | - |
| equidistant-point-pairs | hashing 1.0 | - |
| fair-capacity | binary_search 1.0 | - |
| fair-cookie-split | backtracking 0.7, recursion 0.3 | recursion: checked by hand 2026-10-14 (hand-corrected: 'hashing' is only a set that skips repeated totals) |
| fibonacci-nth | recursion 0.7, dp 0.3 | dp: code: better() memoizes or fills a dp table, hint: the pattern hint names it |
| find-all-duplicates | arrays 1.0 | - (hand-corrected: 'sorting' only orders the output; the idea is marking values in place) |
| find-center | graphs 1.0 | - |
| first-cycle-edge | graphs 1.0 | - |
| first-missing-positive | arrays 1.0 | - |
| first-repeat | hashing 1.0 | - |
| first-unique-char | strings 1.0 | - |
| four-sum-count | hashing 1.0 | - |
| frequency-sort | sorting 0.7, hashing 0.3 | hashing: code(weak): optimal() uses a dict / set, hint: the pattern hint names it |
| gas-station-start | greedy 1.0 | - |
| gcd-recursive | recursion 1.0 | - |
| generate-parentheses-count | recursion 0.7, dp 0.3 | dp: code: better() memoizes or fills a dp table, hint: the nudge/walkthrough mentions it |
| gray-code-sequence | recursion 1.0 | - |
| grid-islands | graphs 1.0 | - |
| grid-paths | dp 1.0 | - |
| grid-walks-count | backtracking 0.7, recursion 0.3 | recursion: code: optimal() has a function (walk) that calls itself |
| group-anagram-count | hashing 0.6, sorting 0.2, strings 0.2 | sorting: code: optimal() sorts the data, hint: the pattern hint names it; strings: input: the problem takes a string |
| group-ones-swaps | sliding_window 1.0 | - |
| h-index-value | sorting 1.0 | - |
| height-balanced-tree | trees 0.7, recursion 0.3 | recursion: code: optimal() has a function (check) that calls itself, hint: the pattern hint names it |
| height-checker | sorting 1.0 | - |
| insert-interval-count | sorting 1.0 | - |
| insert-position | binary_search 1.0 | - |
| integer-partitions | recursion 0.7, dp 0.3 | dp: code: better() memoizes or fills a dp table, hint: the nudge/walkthrough mentions it |
| integer-sqrt | binary_search 1.0 | - |
| invert-tree | trees 0.7, recursion 0.3 | recursion: code: optimal() has a function (optimal) that calls itself, hint: the pattern hint names it |
| is-anagram | strings 1.0 | - |
| is-valid-bst | trees 0.7, recursion 0.3 | recursion: code: optimal() has a function (check) that calls itself |
| isomorphic-texts | hashing 0.7, strings 0.3 | strings: input: the problem takes a string |
| job-sequencing-profit | greedy 0.6, sorting 0.2, heaps 0.2 | sorting: code: optimal() sorts the data, hint: the pattern hint names it; heaps: code: optimal() uses a heap, hint: the pattern hint names it |
| josephus-survivor | recursion 1.0 | - |
| jump-reach | greedy 1.0 | - |
| k-closest-elements | heaps 0.6, binary_search 0.4 | binary_search: checked by hand 2026-10-14 (hand-corrected: the input is already sorted; the efficient solution is a binary search) |
| k-smallest-pair-sums | heaps 1.0 | - |
| knapsack-01 | dp 0.7, recursion 0.3 | recursion: code: better() has a function (go) that calls itself |
| kth-grammar-symbol | recursion 1.0 | - |
| kth-in-sorted-matrix | binary_search 1.0 | - (hand-corrected: 'sorting' only reflects the sorted input, not a skill the solution needs) |
| kth-largest | heaps 1.0 | - |
| kth-permutation | recursion 1.0 | - |
| kth-smallest-in-lists | heaps 1.0 | - |
| kth-smallest-pair-distance | binary_search 0.6, sorting 0.2, two_pointers 0.2 | sorting: code: optimal() sorts the data, hint: the pattern hint names it; two_pointers: hint: the pattern hint names it |
| lamp-placement-tree | trees 0.6, recursion 0.2, greedy 0.2 | recursion: code: optimal() has a function (state) that calls itself; greedy: hint: the pattern hint names it |
| largest-number | sorting 1.0 | - |
| largest-rectangle | stack_queue 1.0 | - |
| largest-square-of-ones | dp 1.0 | - |
| largest-triangle-perimeter | sorting 1.0 | - |
| last-stone-weight | heaps 0.7, stack_queue 0.3 | stack_queue: hint: the pattern hint names it |
| lemonade-change | greedy 1.0 | - |
| level-sums | trees 0.6, stack_queue 0.2, graphs 0.2 | stack_queue: hint: the pattern hint names it; graphs: hint: the pattern hint names it |
| lone-element | binary_search 1.0 | - |
| longest-at-most-k-kinds | sliding_window 1.0 | - |
| longest-balanced-run | hashing 1.0 | - |
| longest-consecutive-run | hashing 1.0 | - |
| longest-harmonious-length | hashing 1.0 | - |
| longest-mirror-subsequence | dp 0.7, strings 0.3 | strings: input: the problem takes a string |
| longest-mountain | two_pointers 1.0 | - |
| longest-palindrome-part | strings 1.0 | - |
| longest-repeat-replace | sliding_window 0.7, strings 0.3 | strings: input: the problem takes a string |
| longest-rising-chain | dp 0.7, binary_search 0.3 | binary_search: checked by hand 2026-10-13 (hand-corrected: 'sorting' came from a hint about a sorted list; the real second skill is binary search) |
| longest-run-with-k-flips | sliding_window 1.0 | - |
| longest-substring-at-least-k-each | sliding_window 0.7, strings 0.3 | strings: input: the problem takes a string |
| longest-unique-run | sliding_window 0.7, strings 0.3 | strings: input: the problem takes a string |
| longest-valid-brackets | stack_queue 0.7, strings 0.3 | strings: input: the problem takes a string |
| lowest-common-ancestor | trees 0.7, recursion 0.3 | recursion: code: optimal() has a function (find) that calls itself, hint: the pattern hint names it |
| matrix-search-sorted-rows | binary_search 1.0 | - |
| max-capital-after-projects | heaps 0.6, sorting 0.2, greedy 0.2 | sorting: code: optimal() sorts the data, hint: the pattern hint names it; greedy: hint: the pattern hint names it |
| max-circular-subarray | arrays 1.0 | - |
| max-depth | trees 0.7, recursion 0.3 | recursion: code: optimal() has a function (optimal) that calls itself, hint: the pattern hint names it |
| max-distinct-window-sum | sliding_window 1.0 | - |
| max-non-overlap | greedy 0.7, sorting 0.3 | sorting: code: optimal() sorts the data, hint: the nudge/walkthrough mentions it |
| max-path-sum | trees 0.7, recursion 0.3 | recursion: code: optimal() has a function (gain) that calls itself, hint: the pattern hint names it |
| max-points-from-ends | sliding_window 1.0 | - |
| max-points-on-line | hashing 1.0 | - |
| max-product-subarray | dp 1.0 | - |
| max-product-three | sorting 1.0 | - |
| max-profit-trades | greedy 1.0 | - |
| max-tree-width | trees 1.0 | - (hand-corrected: 'graphs' came from the word breadth-first; level order is a tree skill) |
| max-vowels-window | sliding_window 0.7, strings 0.3 | strings: input: the problem takes a string |
| median-two-sorted | binary_search 1.0 | - |
| merge-sorted-arrays | sorting 0.7, two_pointers 0.3 | two_pointers: hint: the pattern hint names it |
| merge-two-lists | linked_list 0.7, two_pointers 0.3 | two_pointers: hint: the pattern hint names it |
| merged-interval-count | sorting 1.0 | - |
| middle-value | linked_list 1.0 | - |
| min-add-brackets | stack_queue 0.7, strings 0.3 | strings: checked by hand 2026-10-13 (hand-corrected: 'hashing' came from the word 'counter'; no hash map is used) |
| min-arrows-count | sorting 1.0 | - |
| min-coins | dp 0.7, recursion 0.3 | recursion: code: better() has a function (go) that calls itself, hint: the nudge/walkthrough mentions it |
| min-cost-path | graphs 0.6, heaps 0.2, stack_queue 0.2 | heaps: code: optimal() uses a heap, hint: the pattern hint names it; stack_queue: hint: the pattern hint names it |
| min-cost-stairs | dp 1.0 | - |
| min-jumps | greedy 0.7, graphs 0.3 | graphs: hint: the pattern hint names it |
| min-knight-moves | graphs 0.7, stack_queue 0.3 | stack_queue: code: optimal() uses a deque / queue, hint: the nudge/walkthrough mentions it |
| min-palindrome-cuts | dp 0.8, strings 0.2 | strings: checked by hand 2026-10-14 (hand-corrected: 'recursion' came from the memoised helper; the intended solution is an iterative table) |
| min-refuel-stops | greedy 0.7, heaps 0.3 | heaps: code: optimal() uses a heap, hint: the pattern hint names it |
| min-rotated | binary_search 1.0 | - |
| min-rotated-with-duplicates | binary_search 1.0 | - |
| min-spanning-cost | graphs 0.7, sorting 0.3 | sorting: code: optimal() sorts the data, hint: the nudge/walkthrough mentions it |
| min-stack-queries | stack_queue 1.0 | - |
| min-subarray-len | sliding_window 0.7, two_pointers 0.3 | two_pointers: hint: the pattern hint names it |
| min-window-cover | strings 0.7, sliding_window 0.3 | sliding_window: hint: the pattern hint names it |
| mini-sudoku-count | backtracking 0.7, recursion 0.3 | recursion: code: optimal() has a function (fill) that calls itself, hint: the nudge/walkthrough mentions it |
| mirror-tree | trees 0.7, recursion 0.3 | recursion: code: optimal() has a function (same) that calls itself, hint: the pattern hint names it |
| missing-number | arrays 1.0 | - |
| monotone-digits-number | greedy 1.0 | - |
| most-valuable-load | greedy 0.7, sorting 0.3 | sorting: code: optimal() sorts the data, hint: the pattern hint names it |
| mountain-peak | binary_search 1.0 | - |
| multiple-of-k-subarray | hashing 1.0 | - |
| multiply-digit-strings | strings 1.0 | - |
| n-queens-count | backtracking 0.7, recursion 0.3 | recursion: code: optimal() has a function (place) that calls itself, code: better() has a function (place) that calls itself |
| nearby-duplicate | hashing 1.0 | - |
| negative-cycle-exists | graphs 1.0 | - |
| next-greater-circular | stack_queue 1.0 | - |
| next-permutation | two_pointers 1.0 | - |
| no-adjacent-ones | backtracking 0.6, dp 0.2, recursion 0.2 | dp: code: better() memoizes or fills a dp table, hint: the nudge/walkthrough mentions it; recursion: code: better() has a function (go) that calls itself |
| nth-smooth-number | heaps 1.0 | - |
| odd-even-regroup | linked_list 0.7, two_pointers 0.3 | two_pointers: hint: the pattern hint names it |
| one-edit-apart | strings 1.0 | - |
| paint-fence-ways | dp 0.7, recursion 0.3 | recursion: code: better() has a function (go) that calls itself |
| paint-region-size | graphs 1.0 | - |
| pair-count | hashing 1.0 | - |
| palindrome-list | linked_list 1.0 | - |
| palindrome-partitions | backtracking 0.6, strings 0.2, dp 0.2 | strings: input: the problem takes a string; dp: hint: the pattern hint names it |
| palindromic-substring-count | strings 1.0 | - |
| parse-integer-text | strings 1.0 | - |
| partition-k-groups | backtracking 0.6, sorting 0.2, recursion 0.2 | sorting: code: optimal() sorts the data; recursion: code: optimal() has a function (place) that calls itself |
| partition-labels-count | greedy 0.7, strings 0.3 | strings: input: the problem takes a string |
| partition-list-around | linked_list 1.0 | - |
| path-in-grid-exists | backtracking 0.6, recursion 0.2, graphs 0.2 | recursion: code: optimal() has a function (go) that calls itself; graphs: hint: the pattern hint names it |
| pattern-occurrences | strings 1.0 | - |
| peak-altitude | arrays 1.0 | - |
| peak-overlap | sorting 1.0 | - |
| perfect-squares-min | dp 1.0 | - |
| postfix-eval | stack_queue 0.7, strings 0.3 | strings: input: the problem takes a string |
| pow-mod | recursion 1.0 | - |
| product-below-k-count | two_pointers 0.7, sliding_window 0.3 | sliding_window: hint: the pattern hint names it |
| product-except-self | arrays 1.0 | - |
| rain-catch | arrays 0.7, two_pointers 0.3 | two_pointers: hint: the pattern hint names it |
| rearrange-no-adjacent | heaps 0.6, strings 0.2, hashing 0.2 | strings: input: the problem takes a string; hashing: code(weak): optimal() uses a dict / set, code(weak): better() uses a dict / set |
| remove-adjacent-dupes | stack_queue 0.7, strings 0.3 | strings: input: the problem takes a string |
| remove-duplicates-length | two_pointers 1.0 | - |
| remove-nth-from-end | linked_list 0.7, two_pointers 0.3 | two_pointers: hint: the pattern hint names it |
| remove-value-length | two_pointers 1.0 | - |
| repeated-value | arrays 0.7, linked_list 0.3 | linked_list: hint: the pattern hint names it |
| restore-ip-count | backtracking 0.6, strings 0.2, recursion 0.2 | strings: input: the problem takes a string; recursion: code: optimal() has a function (go) that calls itself |
| reverse-between | linked_list 1.0 | - |
| reverse-k-group | linked_list 1.0 | - |
| reverse-list | linked_list 1.0 | - |
| right-side-leaders | arrays 1.0 | - |
| root-to-leaf-sum | trees 0.7, recursion 0.3 | recursion: code: optimal() has a function (go) that calls itself, hint: the pattern hint names it |
| rope-join | heaps 0.7, greedy 0.3 | greedy: hint: the pattern hint names it |
| rotate-list-right | linked_list 1.0 | - |
| rotate-matrix-clockwise | arrays 1.0 | - |
| rotate-right | arrays 1.0 | - |
| rotting-oranges | graphs 0.7, stack_queue 0.3 | stack_queue: code: optimal() uses a deque / queue, hint: the pattern hint names it |
| running-median-sum | heaps 1.0 | - |
| safe-nodes | graphs 1.0 | - |
| same-tree | trees 0.7, recursion 0.3 | recursion: code: optimal() has a function (optimal) that calls itself, hint: the pattern hint names it |
| search-in-bitonic-array | binary_search 1.0 | - |
| search-rotated | binary_search 0.7, sorting 0.3 | sorting: hint: the pattern hint names it |
| search-sorted | binary_search 1.0 | - |
| second-highest | arrays 1.0 | - |
| shared-subsequence-length | dp 0.7, strings 0.3 | strings: input: the problem takes a string |
| shortest-cycle-length | graphs 0.8, stack_queue 0.2 | stack_queue: checked by hand 2026-10-14 (hand-corrected: 'trees' came from the words 'search tree' in a hint) |
| shortest-grid-path | graphs 0.7, stack_queue 0.3 | stack_queue: code: optimal() uses a deque / queue, hint: the nudge/walkthrough mentions it |
| shortest-palindrome-extension | strings 1.0 | - |
| shortest-sum-at-least | sliding_window 0.7, stack_queue 0.3 | stack_queue: code: optimal() uses a deque / queue, hint: the pattern hint names it |
| shrink-to-half | greedy 0.6, sorting 0.2, hashing 0.2 | sorting: code: optimal() sorts the data, hint: the nudge/walkthrough mentions it; hashing: code(weak): optimal() uses a dict / set, hint: the nudge/walkthrough mentions it |
| signal-spread-time | graphs 0.7, heaps 0.3 | heaps: code: optimal() uses a heap, hint: the pattern hint names it |
| simplify-path | stack_queue 0.7, strings 0.3 | strings: input: the problem takes a string |
| skip-neighbours | dp 1.0 | - |
| smallest-after-removal | greedy 0.6, strings 0.2, stack_queue 0.2 | strings: input: the problem takes a string; stack_queue: hint: the pattern hint names it |
| smallest-build-order | graphs 0.7, heaps 0.3 | heaps: code: optimal() uses a heap, hint: the pattern hint names it |
| smallest-covering-range | heaps 1.0 | - |
| smallest-gap | sorting 1.0 | - |
| sort-by-bit-count | sorting 1.0 | - |
| sort-list | linked_list 0.6, recursion 0.2, sorting 0.2 | recursion: code: optimal() has a function (sort) that calls itself, hint: the pattern hint names it; sorting: hint: the pattern hint names it |
| sort-three-colors | two_pointers 0.7, sorting 0.3 | sorting: checked by hand 2026-10-14 (hand-corrected: 'binary_search' came from the word 'partition'; this is a three-way partition sort) |
| sorted-pair-sum | two_pointers 1.0 | - |
| sorted-squares | two_pointers 1.0 | - |
| spiral-walk | arrays 1.0 | - |
| spread-out-stalls | binary_search 0.6, sorting 0.2, greedy 0.2 | sorting: code: optimal() sorts the data; greedy: hint: the pattern hint names it |
| stair-ways | recursion 0.7, dp 0.3 | dp: code: better() memoizes or fills a dp table, hint: the pattern hint names it |
| stock-profit-cooldown | dp 1.0 | - |
| stock-profit-k-trades | dp 1.0 | - |
| strict-majority | arrays 1.0 | - |
| subarray-sum-count | hashing 1.0 | - |
| subarrays-divisible-count | hashing 1.0 | - |
| subarrays-exactly-k-distinct | sliding_window 1.0 | - |
| subset-sum-count | backtracking 0.7, recursion 0.3 | recursion: code: optimal() has a function (go) that calls itself, hint: the nudge/walkthrough mentions it |
| swap-adjacent-nodes | linked_list 1.0 | - |
| taps-to-water-garden | greedy 1.0 | - |
| target-expression-count | backtracking 0.6, recursion 0.2, strings 0.2 | recursion: code: optimal() has a function (go) that calls itself, hint: the nudge/walkthrough mentions it; strings: input: the problem takes a string |
| target-signs-count | backtracking 1.0 | - |
| task-cooldown-time | heaps 0.6, strings 0.2, greedy 0.2 | strings: input: the problem takes a string; greedy: hint: the pattern hint names it |
| three-sum-count | two_pointers 0.7, sorting 0.3 | sorting: code: optimal() sorts the data, hint: the pattern hint names it |
| tidy-sentence | strings 1.0 | - |
| top-k-frequent | heaps 0.6, hashing 0.2, sorting 0.2 | hashing: code(weak): optimal() uses a dict / set, hint: the pattern hint names it; sorting: code: optimal() sorts the data, hint: the nudge/walkthrough mentions it |
| top-k-sum | heaps 1.0 | - |
| town-judge | graphs 1.0 | - |
| tree-diameter | trees 0.7, recursion 0.3 | recursion: code: optimal() has a function (height) that calls itself, hint: the pattern hint names it |
| tree-robbery-max | dp 0.6, trees 0.2, recursion 0.2 | trees: hint: the pattern hint names it, input: the problem takes a tree; recursion: code: optimal() has a function (go) that calls itself, hint: the nudge/walkthrough mentions it |
| triangle-min-path | dp 1.0 | - |
| triplets-sum-below | two_pointers 0.7, sorting 0.3 | sorting: code: optimal() sorts the data, hint: the pattern hint names it |
| two-team-split | graphs 1.0 | - |
| unique-bst-count | dp 0.8, trees 0.2 | trees: checked by hand 2026-10-14 (hand-corrected: 'recursion' came from the memoised helper; the table counts tree shapes) |
| unique-sum | hashing 1.0 | - |
| valid-palindrome-one-delete | two_pointers 0.7, strings 0.3 | strings: input: the problem takes a string |
| valid-stack-sequence | stack_queue 1.0 | - |
| visible-from-right | trees 0.7, recursion 0.3 | recursion: checked by hand 2026-10-13 (hand-corrected: 'graphs' came from the word 'depth-first' in a hint; it is a tree problem) |
| water-supply-min-cost | graphs 0.8, sorting 0.2 | sorting: checked by hand 2026-10-14 (hand-corrected: 'trees' came from the words 'spanning tree') |
| ways-to-make-change | dp 1.0 | - |
| widest-fence | two_pointers 1.0 | - |
| wiggle-subsequence-length | greedy 1.0 | - |
| wildcard-match | dp 0.6, recursion 0.2, strings 0.2 | recursion: code: better() has a function (go) that calls itself, hint: the nudge/walkthrough mentions it; strings: input: the problem takes a string |
| window-distinct-counts | sliding_window 0.7, hashing 0.3 | hashing: code(weak): optimal() uses a dict / set, hint: the nudge/walkthrough mentions it |
| window-max-total | sliding_window 0.7, stack_queue 0.3 | stack_queue: code: optimal() uses a deque / queue, hint: the pattern hint names it |
| word-pattern-match | strings 0.7, hashing 0.3 | hashing: code(weak): optimal() uses a dict / set, hint: the pattern hint names it |
| xor-subset-total | recursion 1.0 | - |
| zero-matrix-total | arrays 1.0 | - |
| zeros-to-end | two_pointers 1.0 | - |
| zigzag-levels | trees 1.0 | - (hand-corrected: 'graphs' came from the word breadth-first; level order is a tree skill) |
| zigzag-rows | strings 1.0 | - |
