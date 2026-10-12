# Proposed skill tags (automatic, needs a human read)

Main concept first with its weight; secondary skills only where there is evidence. Edit `skills.json` to correct anything, then run `npm run content:build && npm run content:seed`.

| problem | skills (weight) | why the extra skills |
|---|---|---|
| add-two-digit-lists | linked_list 1.0 | - |
| asteroid-survivors | stack_queue 1.0 | - |
| backspace-compare | stack_queue 0.7, strings 0.3 | strings: input: the problem takes a string |
| balanced-brackets | stack_queue 0.7, strings 0.3 | strings: input: the problem takes a string |
| balloon-burst-max | dp 1.0 | - |
| baseball-score | stack_queue 0.7, strings 0.3 | strings: input: the problem takes a string |
| best-streak-sum | arrays 1.0 | - |
| best-window | sliding_window 1.0 | - |
| bst-kth-value | trees 1.0 | - |
| build-tree-from-orders | trees 0.6, recursion 0.2, hashing 0.2 | recursion: code: optimal() has a function (build) that calls itself, hint: the pattern hint names it; hashing: code(weak): optimal() uses a dict / set, hint: the pattern hint names it |
| can-finish-courses | graphs 1.0 | - |
| candy-distribution | greedy 1.0 | - |
| cheapest-with-stops | graphs 1.0 | - |
| circular-street-robbery | dp 1.0 | - |
| clean-palindrome | strings 0.7, two_pointers 0.3 | two_pointers: hint: the pattern hint names it |
| climb-with-ladders | heaps 1.0 | - |
| closest-k-points | heaps 1.0 | - |
| closest-triplet-sum | two_pointers 0.7, sorting 0.3 | sorting: code: optimal() sorts the data, hint: the pattern hint names it |
| combination-sum-count | backtracking 0.6, dp 0.2, recursion 0.2 | dp: code: better() memoizes or fills a dp table, hint: the pattern hint names it; recursion: code: better() has a function (go) that calls itself, hint: the nudge/walkthrough mentions it |
| compare-versions | strings 0.7, two_pointers 0.3 | two_pointers: hint: the pattern hint names it |
| compress-string | strings 0.6, hashing 0.2, two_pointers 0.2 | hashing: hint: the pattern hint names it; two_pointers: hint: the pattern hint names it |
| connected-groups | graphs 1.0 | - |
| cookie-match | greedy 0.7, sorting 0.3 | sorting: code: optimal() sorts the data, hint: the pattern hint names it |
| count-inversions | sorting 0.7, recursion 0.3 | recursion: code: optimal() has a function (sort) that calls itself, hint: the nudge/walkthrough mentions it |
| count-of-value | binary_search 1.0 | - |
| count-windows-above | sliding_window 1.0 | - |
| critical-link-count | graphs 0.6, recursion 0.2, trees 0.2 | recursion: code: optimal() has a function (visit) that calls itself; trees: hint: the pattern hint names it |
| cycle-length | linked_list 1.0 | - |
| cycle-start-index | linked_list 1.0 | - |
| days-until-warmer | stack_queue 1.0 | - |
| decode-nested | stack_queue 0.7, strings 0.3 | strings: input: the problem takes a string |
| digit-square-loop | hashing 1.0 | - |
| distinct-permutations | recursion 0.6, strings 0.2, sorting 0.2 | strings: input: the problem takes a string; sorting: code: better() sorts the data |
| edit-distance | dp 0.6, recursion 0.2, strings 0.2 | recursion: code: better() has a function (go) that calls itself, hint: the nudge/walkthrough mentions it; strings: input: the problem takes a string |
| equal-sum-split | dp 1.0 | - |
| equidistant-point-pairs | hashing 1.0 | - |
| fair-capacity | binary_search 1.0 | - |
| fibonacci-nth | recursion 0.7, dp 0.3 | dp: code: better() memoizes or fills a dp table, hint: the pattern hint names it |
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
| grid-islands | graphs 1.0 | - |
| grid-paths | dp 1.0 | - |
| grid-walks-count | backtracking 0.7, recursion 0.3 | recursion: code: optimal() has a function (walk) that calls itself |
| group-anagram-count | hashing 0.6, sorting 0.2, strings 0.2 | sorting: code: optimal() sorts the data, hint: the pattern hint names it; strings: input: the problem takes a string |
| height-checker | sorting 1.0 | - |
| insert-position | binary_search 1.0 | - |
| integer-partitions | recursion 0.7, dp 0.3 | dp: code: better() memoizes or fills a dp table, hint: the nudge/walkthrough mentions it |
| integer-sqrt | binary_search 1.0 | - |
| invert-tree | trees 0.7, recursion 0.3 | recursion: code: optimal() has a function (optimal) that calls itself, hint: the pattern hint names it |
| is-anagram | strings 1.0 | - |
| is-valid-bst | trees 0.7, recursion 0.3 | recursion: code: optimal() has a function (check) that calls itself |
| josephus-survivor | recursion 1.0 | - |
| jump-reach | greedy 1.0 | - |
| knapsack-01 | dp 0.7, recursion 0.3 | recursion: code: better() has a function (go) that calls itself |
| kth-grammar-symbol | recursion 1.0 | - |
| kth-in-sorted-matrix | binary_search 0.7, sorting 0.3 | sorting: hint: the pattern hint names it |
| kth-largest | heaps 1.0 | - |
| kth-smallest-in-lists | heaps 1.0 | - |
| lamp-placement-tree | trees 0.6, recursion 0.2, greedy 0.2 | recursion: code: optimal() has a function (state) that calls itself; greedy: hint: the pattern hint names it |
| largest-number | sorting 1.0 | - |
| largest-rectangle | stack_queue 1.0 | - |
| last-stone-weight | heaps 0.7, stack_queue 0.3 | stack_queue: hint: the pattern hint names it |
| lemonade-change | greedy 1.0 | - |
| level-sums | trees 0.6, stack_queue 0.2, graphs 0.2 | stack_queue: hint: the pattern hint names it; graphs: hint: the pattern hint names it |
| lone-element | binary_search 1.0 | - |
| longest-at-most-k-kinds | sliding_window 1.0 | - |
| longest-balanced-run | hashing 1.0 | - |
| longest-consecutive-run | hashing 1.0 | - |
| longest-mirror-subsequence | dp 0.7, strings 0.3 | strings: input: the problem takes a string |
| longest-mountain | two_pointers 1.0 | - |
| longest-palindrome-part | strings 1.0 | - |
| longest-repeat-replace | sliding_window 0.7, strings 0.3 | strings: input: the problem takes a string |
| longest-rising-chain | dp 0.6, sorting 0.2, binary_search 0.2 | sorting: hint: the pattern hint names it; binary_search: code: optimal() uses bisect |
| longest-run-with-k-flips | sliding_window 1.0 | - |
| longest-unique-run | sliding_window 0.7, strings 0.3 | strings: input: the problem takes a string |
| lowest-common-ancestor | trees 0.7, recursion 0.3 | recursion: code: optimal() has a function (find) that calls itself, hint: the pattern hint names it |
| max-depth | trees 0.7, recursion 0.3 | recursion: code: optimal() has a function (optimal) that calls itself, hint: the pattern hint names it |
| max-non-overlap | greedy 0.7, sorting 0.3 | sorting: code: optimal() sorts the data, hint: the nudge/walkthrough mentions it |
| max-path-sum | trees 0.7, recursion 0.3 | recursion: code: optimal() has a function (gain) that calls itself, hint: the pattern hint names it |
| max-product-three | sorting 1.0 | - |
| max-profit-trades | greedy 1.0 | - |
| max-vowels-window | sliding_window 0.7, strings 0.3 | strings: input: the problem takes a string |
| median-two-sorted | binary_search 1.0 | - |
| merge-sorted-arrays | sorting 0.7, two_pointers 0.3 | two_pointers: hint: the pattern hint names it |
| merge-two-lists | linked_list 0.7, two_pointers 0.3 | two_pointers: hint: the pattern hint names it |
| merged-interval-count | sorting 1.0 | - |
| middle-value | linked_list 1.0 | - |
| min-add-brackets | stack_queue 0.6, strings 0.2, hashing 0.2 | strings: input: the problem takes a string; hashing: hint: the pattern hint names it |
| min-coins | dp 0.7, recursion 0.3 | recursion: code: better() has a function (go) that calls itself, hint: the nudge/walkthrough mentions it |
| min-cost-path | graphs 0.6, heaps 0.2, stack_queue 0.2 | heaps: code: optimal() uses a heap, hint: the pattern hint names it; stack_queue: hint: the pattern hint names it |
| min-cost-stairs | dp 1.0 | - |
| min-jumps | greedy 0.7, graphs 0.3 | graphs: hint: the pattern hint names it |
| min-refuel-stops | greedy 0.7, heaps 0.3 | heaps: code: optimal() uses a heap, hint: the pattern hint names it |
| min-rotated | binary_search 1.0 | - |
| min-spanning-cost | graphs 0.7, sorting 0.3 | sorting: code: optimal() sorts the data, hint: the nudge/walkthrough mentions it |
| min-subarray-len | sliding_window 0.7, two_pointers 0.3 | two_pointers: hint: the pattern hint names it |
| min-window-cover | strings 0.7, sliding_window 0.3 | sliding_window: hint: the pattern hint names it |
| mini-sudoku-count | backtracking 0.7, recursion 0.3 | recursion: code: optimal() has a function (fill) that calls itself, hint: the nudge/walkthrough mentions it |
| mirror-tree | trees 0.7, recursion 0.3 | recursion: code: optimal() has a function (same) that calls itself, hint: the pattern hint names it |
| missing-number | arrays 1.0 | - |
| mountain-peak | binary_search 1.0 | - |
| multiple-of-k-subarray | hashing 1.0 | - |
| n-queens-count | backtracking 0.7, recursion 0.3 | recursion: code: optimal() has a function (place) that calls itself, code: better() has a function (place) that calls itself |
| nearby-duplicate | hashing 1.0 | - |
| next-permutation | two_pointers 1.0 | - |
| no-adjacent-ones | backtracking 0.6, dp 0.2, recursion 0.2 | dp: code: better() memoizes or fills a dp table, hint: the nudge/walkthrough mentions it; recursion: code: better() has a function (go) that calls itself |
| odd-even-regroup | linked_list 0.7, two_pointers 0.3 | two_pointers: hint: the pattern hint names it |
| paint-fence-ways | dp 0.7, recursion 0.3 | recursion: code: better() has a function (go) that calls itself |
| paint-region-size | graphs 1.0 | - |
| pair-count | hashing 1.0 | - |
| palindrome-list | linked_list 1.0 | - |
| palindrome-partitions | backtracking 0.6, strings 0.2, dp 0.2 | strings: input: the problem takes a string; dp: hint: the pattern hint names it |
| palindromic-substring-count | strings 1.0 | - |
| partition-k-groups | backtracking 0.6, sorting 0.2, recursion 0.2 | sorting: code: optimal() sorts the data; recursion: code: optimal() has a function (place) that calls itself |
| partition-labels-count | greedy 0.7, strings 0.3 | strings: input: the problem takes a string |
| path-in-grid-exists | backtracking 0.6, recursion 0.2, graphs 0.2 | recursion: code: optimal() has a function (go) that calls itself; graphs: hint: the pattern hint names it |
| peak-altitude | arrays 1.0 | - |
| peak-overlap | sorting 1.0 | - |
| postfix-eval | stack_queue 0.7, strings 0.3 | strings: input: the problem takes a string |
| pow-mod | recursion 1.0 | - |
| product-below-k-count | two_pointers 0.7, sliding_window 0.3 | sliding_window: hint: the pattern hint names it |
| product-except-self | arrays 1.0 | - |
| rain-catch | arrays 0.7, two_pointers 0.3 | two_pointers: hint: the pattern hint names it |
| rearrange-no-adjacent | heaps 0.6, strings 0.2, hashing 0.2 | strings: input: the problem takes a string; hashing: code(weak): optimal() uses a dict / set, code(weak): better() uses a dict / set |
| remove-adjacent-dupes | stack_queue 0.7, strings 0.3 | strings: input: the problem takes a string |
| remove-duplicates-length | two_pointers 1.0 | - |
| remove-nth-from-end | linked_list 0.7, two_pointers 0.3 | two_pointers: hint: the pattern hint names it |
| repeated-value | arrays 0.7, linked_list 0.3 | linked_list: hint: the pattern hint names it |
| reverse-k-group | linked_list 1.0 | - |
| reverse-list | linked_list 1.0 | - |
| root-to-leaf-sum | trees 0.7, recursion 0.3 | recursion: code: optimal() has a function (go) that calls itself, hint: the pattern hint names it |
| rope-join | heaps 0.7, greedy 0.3 | greedy: hint: the pattern hint names it |
| rotate-right | arrays 1.0 | - |
| rotting-oranges | graphs 0.7, stack_queue 0.3 | stack_queue: code: optimal() uses a deque / queue, hint: the pattern hint names it |
| running-median-sum | heaps 1.0 | - |
| same-tree | trees 0.7, recursion 0.3 | recursion: code: optimal() has a function (optimal) that calls itself, hint: the pattern hint names it |
| search-rotated | binary_search 0.7, sorting 0.3 | sorting: hint: the pattern hint names it |
| search-sorted | binary_search 1.0 | - |
| second-highest | arrays 1.0 | - |
| shared-subsequence-length | dp 0.7, strings 0.3 | strings: input: the problem takes a string |
| shortest-grid-path | graphs 0.7, stack_queue 0.3 | stack_queue: code: optimal() uses a deque / queue, hint: the nudge/walkthrough mentions it |
| shortest-palindrome-extension | strings 1.0 | - |
| shortest-sum-at-least | sliding_window 0.7, stack_queue 0.3 | stack_queue: code: optimal() uses a deque / queue, hint: the pattern hint names it |
| signal-spread-time | graphs 0.7, heaps 0.3 | heaps: code: optimal() uses a heap, hint: the pattern hint names it |
| skip-neighbours | dp 1.0 | - |
| smallest-after-removal | greedy 0.6, strings 0.2, stack_queue 0.2 | strings: input: the problem takes a string; stack_queue: hint: the pattern hint names it |
| smallest-gap | sorting 1.0 | - |
| sort-list | linked_list 0.6, recursion 0.2, sorting 0.2 | recursion: code: optimal() has a function (sort) that calls itself, hint: the pattern hint names it; sorting: hint: the pattern hint names it |
| sorted-pair-sum | two_pointers 1.0 | - |
| sorted-squares | two_pointers 1.0 | - |
| spiral-walk | arrays 1.0 | - |
| stair-ways | recursion 0.7, dp 0.3 | dp: code: better() memoizes or fills a dp table, hint: the pattern hint names it |
| strict-majority | arrays 1.0 | - |
| subarray-sum-count | hashing 1.0 | - |
| subset-sum-count | backtracking 0.7, recursion 0.3 | recursion: code: optimal() has a function (go) that calls itself, hint: the nudge/walkthrough mentions it |
| target-signs-count | backtracking 1.0 | - |
| three-sum-count | two_pointers 0.7, sorting 0.3 | sorting: code: optimal() sorts the data, hint: the pattern hint names it |
| tidy-sentence | strings 1.0 | - |
| top-k-frequent | heaps 0.6, hashing 0.2, sorting 0.2 | hashing: code(weak): optimal() uses a dict / set, hint: the pattern hint names it; sorting: code: optimal() sorts the data, hint: the nudge/walkthrough mentions it |
| top-k-sum | heaps 1.0 | - |
| town-judge | graphs 1.0 | - |
| tree-diameter | trees 0.7, recursion 0.3 | recursion: code: optimal() has a function (height) that calls itself, hint: the pattern hint names it |
| triangle-min-path | dp 1.0 | - |
| two-team-split | graphs 1.0 | - |
| valid-stack-sequence | stack_queue 1.0 | - |
| visible-from-right | trees 0.6, recursion 0.2, graphs 0.2 | recursion: code: optimal() has a function (visit) that calls itself, hint: the nudge/walkthrough mentions it; graphs: hint: the pattern hint names it |
| ways-to-make-change | dp 1.0 | - |
| widest-fence | two_pointers 1.0 | - |
| wildcard-match | dp 0.6, recursion 0.2, strings 0.2 | recursion: code: better() has a function (go) that calls itself, hint: the nudge/walkthrough mentions it; strings: input: the problem takes a string |
| window-max-total | sliding_window 0.7, stack_queue 0.3 | stack_queue: code: optimal() uses a deque / queue, hint: the pattern hint names it |
| word-pattern-match | strings 0.7, hashing 0.3 | hashing: code(weak): optimal() uses a dict / set, hint: the pattern hint names it |
| zeros-to-end | two_pointers 1.0 | - |
