require('dotenv').config();
const mongoose = require('mongoose');
const Problem = require('./models/Problem');

const problems = [
  {
    title: 'Two Sum',
    difficulty: 'Easy',
    category: 'array',
    description: 'Given an array of integers and a target, return indices of the two numbers that add up to target.',
    starterCode: 'class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        \n    }\n}',
    driverTemplate: `import java.util.*;

{{SOLUTION}}

public class Main {
    public static void main(String[] args) {
        Solution sol = new Solution();
        int[][] inputs = {{2,7,11,15}, {3,2,4}, {3,3}};
        int[] targets = {9, 6, 6};
        int[][] expected = {{0,1}, {1,2}, {0,1}};

        int passCount = 0;
        for (int i = 0; i < inputs.length; i++) {
            int[] result = sol.twoSum(inputs[i], targets[i]);
            boolean match = Arrays.equals(result, expected[i]);
            System.out.println("Test " + (i+1) + ": " + (match ? "PASS" : "FAIL"));
            if (match) passCount++;
        }
        System.out.println("RESULT:" + passCount + "/" + inputs.length);
    }
}`,
    testCases: [
      { input: '[2,7,11,15], 9', expectedOutput: '[0, 1]' },
      { input: '[3,2,4], 6', expectedOutput: '[1, 2]' },
      { input: '[3,3], 6', expectedOutput: '[0, 1]' }
    ]
  },
  {
    title: 'Longest Substring Without Repeating Characters',
    difficulty: 'Medium',
    category: 'string',
    description: 'Given a string, find the length of the longest substring without repeating characters.',
    starterCode: 'class Solution {\n    public int lengthOfLongestSubstring(String s) {\n        \n    }\n}',
    driverTemplate: `{{SOLUTION}}

public class Main {
    public static void main(String[] args) {
        Solution sol = new Solution();
        String[] inputs = {"abcabcbb", "bbbbb", "pwwkew"};
        int[] expected = {3, 1, 3};

        int passCount = 0;
        for (int i = 0; i < inputs.length; i++) {
            int result = sol.lengthOfLongestSubstring(inputs[i]);
            boolean match = result == expected[i];
            System.out.println("Test " + (i+1) + ": " + (match ? "PASS" : "FAIL"));
            if (match) passCount++;
        }
        System.out.println("RESULT:" + passCount + "/" + inputs.length);
    }
}`,
    testCases: [
      { input: '"abcabcbb"', expectedOutput: '3' },
      { input: '"bbbbb"', expectedOutput: '1' },
      { input: '"pwwkew"', expectedOutput: '3' }
    ]
  }
  ,
{
  title: 'Valid Parentheses',
  difficulty: 'Easy',
  category: 'stack',
  description: 'Given a string containing just the characters (), {}, and [], determine if the input string is valid.',
  starterCode: `class Solution {
    public boolean isValid(String s) {

    }
}`,
  driverTemplate: `{{SOLUTION}}

public class Main {
    public static void main(String[] args) {
        Solution sol = new Solution();

        String[] inputs = {"()", "()[]{}", "(]", "([)]", "{[]}"};
        boolean[] expected = {true, true, false, false, true};

        int pass = 0;
        for(int i=0;i<inputs.length;i++){
            boolean ans = sol.isValid(inputs[i]);
            boolean ok = ans == expected[i];
            System.out.println("Test " + (i+1) + ": " + (ok ? "PASS":"FAIL"));
            if(ok) pass++;
        }

        System.out.println("RESULT:"+pass+"/"+inputs.length);
    }
}`,
  testCases: [
    { input: '"()"', expectedOutput: 'true' },
    { input: '"()[]{}"', expectedOutput: 'true' },
    { input: '"(]"', expectedOutput: 'false' }
  ]
},
{
  title: 'Merge Sorted Array',
  difficulty: 'Easy',
  category: 'array',
  description: 'Merge two sorted arrays into one sorted array.',
  starterCode: `class Solution {
    public void merge(int[] nums1, int m, int[] nums2, int n) {

    }
}`,
  driverTemplate: `import java.util.*;

{{SOLUTION}}

public class Main {
    public static void main(String[] args){
        Solution sol = new Solution();

        int[] a1={1,2,3,0,0,0};
        sol.merge(a1,3,new int[]{2,5,6},3);

        int[] a2={1};
        sol.merge(a2,1,new int[]{},0);

        int[] a3={0};
        sol.merge(a3,0,new int[]{1},1);

        int pass=0;

        if(Arrays.equals(a1,new int[]{1,2,2,3,5,6})) pass++;
        if(Arrays.equals(a2,new int[]{1})) pass++;
        if(Arrays.equals(a3,new int[]{1})) pass++;

        System.out.println("RESULT:"+pass+"/3");
    }
}`,
  testCases:[
    {input:"[1,2,3,0,0,0],3,[2,5,6],3",expectedOutput:"[1,2,2,3,5,6]"},
    {input:"[1],1,[],0",expectedOutput:"[1]"},
    {input:"[0],0,[1],1",expectedOutput:"[1]"}
  ]
},
{
  title: 'Binary Search',
  difficulty: 'Easy',
  category: 'binary-search',
  description: 'Given a sorted array and a target, return its index. Otherwise return -1.',
  starterCode:`class Solution {
    public int search(int[] nums, int target) {

    }
}`,
  driverTemplate:`{{SOLUTION}}

public class Main{
    public static void main(String[] args){
        Solution sol=new Solution();

        int pass=0;

        if(sol.search(new int[]{-1,0,3,5,9,12},9)==4) pass++;
        if(sol.search(new int[]{-1,0,3,5,9,12},2)==-1) pass++;
        if(sol.search(new int[]{5},5)==0) pass++;

        System.out.println("RESULT:"+pass+"/3");
    }
}`,
  testCases:[
    {input:"[-1,0,3,5,9,12],9",expectedOutput:"4"},
    {input:"[-1,0,3,5,9,12],2",expectedOutput:"-1"},
    {input:"[5],5",expectedOutput:"0"}
  ]
},
{
  title:'Maximum Subarray',
  difficulty:'Medium',
  category:'array',
  description:'Find the contiguous subarray with the largest sum.',
  starterCode:`class Solution{
    public int maxSubArray(int[] nums){

    }
}`,
  driverTemplate:`{{SOLUTION}}

public class Main{
    public static void main(String[] args){
        Solution sol=new Solution();

        int pass=0;

        if(sol.maxSubArray(new int[]{-2,1,-3,4,-1,2,1,-5,4})==6) pass++;
        if(sol.maxSubArray(new int[]{1})==1) pass++;
        if(sol.maxSubArray(new int[]{5,4,-1,7,8})==23) pass++;

        System.out.println("RESULT:"+pass+"/3");
    }
}`,
  testCases:[
    {input:"[-2,1,-3,4,-1,2,1,-5,4]",expectedOutput:"6"},
    {input:"[1]",expectedOutput:"1"},
    {input:"[5,4,-1,7,8]",expectedOutput:"23"}
  ]
},
{
  title:'Best Time to Buy and Sell Stock',
  difficulty:'Easy',
  category:'array',
  description:'Return the maximum profit you can achieve from buying and selling one stock.',
  starterCode:`class Solution{
    public int maxProfit(int[] prices){

    }
}`,
  driverTemplate:`{{SOLUTION}}

public class Main{
    public static void main(String[] args){
        Solution sol=new Solution();

        int pass=0;

        if(sol.maxProfit(new int[]{7,1,5,3,6,4})==5) pass++;
        if(sol.maxProfit(new int[]{7,6,4,3,1})==0) pass++;
        if(sol.maxProfit(new int[]{2,4,1})==2) pass++;

        System.out.println("RESULT:"+pass+"/3");
    }
}`,
  testCases:[
    {input:"[7,1,5,3,6,4]",expectedOutput:"5"},
    {input:"[7,6,4,3,1]",expectedOutput:"0"},
    {input:"[2,4,1]",expectedOutput:"2"}
  ]
}
,
{
  title: 'Reverse Linked List',
  difficulty: 'Easy',
  category: 'linked-list',
  description: 'Reverse a singly linked list and return the new head.',
  starterCode: `class ListNode {
    int val;
    ListNode next;
    ListNode() {}
    ListNode(int val) { this.val = val; }
    ListNode(int val, ListNode next) { this.val = val; this.next = next; }
}

class Solution {
    public ListNode reverseList(ListNode head) {

    }
}`,
  driverTemplate: `{{SOLUTION}}

public class Main {

    static ListNode create(int[] arr){
        ListNode dummy = new ListNode(0);
        ListNode curr = dummy;
        for(int n : arr){
            curr.next = new ListNode(n);
            curr = curr.next;
        }
        return dummy.next;
    }

    static boolean equal(ListNode a, int[] arr){
        int i = 0;
        while(a != null && i < arr.length){
            if(a.val != arr[i]) return false;
            a = a.next;
            i++;
        }
        return a == null && i == arr.length;
    }

    public static void main(String[] args){
        Solution sol = new Solution();

        int pass = 0;

        if(equal(sol.reverseList(create(new int[]{1,2,3,4,5})), new int[]{5,4,3,2,1})) pass++;
        if(equal(sol.reverseList(create(new int[]{1,2})), new int[]{2,1})) pass++;
        if(equal(sol.reverseList(create(new int[]{})), new int[]{})) pass++;

        System.out.println("RESULT:"+pass+"/3");
    }
}`,
  testCases: [
    { input: "[1,2,3,4,5]", expectedOutput: "[5,4,3,2,1]" },
    { input: "[1,2]", expectedOutput: "[2,1]" },
    { input: "[]", expectedOutput: "[]" }
  ]
},
{
  title: 'Middle of the Linked List',
  difficulty: 'Easy',
  category: 'linked-list',
  description: 'Return the middle node of a linked list.',
  starterCode: `class ListNode {
    int val;
    ListNode next;
    ListNode(){}
    ListNode(int val){this.val=val;}
    ListNode(int val,ListNode next){this.val=val;this.next=next;}
}

class Solution {
    public ListNode middleNode(ListNode head) {

    }
}`,
  driverTemplate: `{{SOLUTION}}

public class Main{

    static ListNode create(int[] arr){
        ListNode dummy=new ListNode(0);
        ListNode curr=dummy;
        for(int x:arr){
            curr.next=new ListNode(x);
            curr=curr.next;
        }
        return dummy.next;
    }

    public static void main(String[] args){
        Solution sol=new Solution();

        int pass=0;

        if(sol.middleNode(create(new int[]{1,2,3,4,5})).val==3) pass++;
        if(sol.middleNode(create(new int[]{1,2,3,4,5,6})).val==4) pass++;
        if(sol.middleNode(create(new int[]{1})).val==1) pass++;

        System.out.println("RESULT:"+pass+"/3");
    }
}`,
  testCases:[
    {input:"[1,2,3,4,5]",expectedOutput:"3"},
    {input:"[1,2,3,4,5,6]",expectedOutput:"4"},
    {input:"[1]",expectedOutput:"1"}
  ]
},
{
  title: 'Valid Anagram',
  difficulty: 'Easy',
  category: 'string',
  description: 'Given two strings s and t, return true if t is an anagram of s.',
  starterCode: `class Solution {
    public boolean isAnagram(String s, String t) {

    }
}`,
  driverTemplate: `{{SOLUTION}}

public class Main{
    public static void main(String[] args){
        Solution sol=new Solution();

        int pass=0;

        if(sol.isAnagram("anagram","nagaram")) pass++;
        if(!sol.isAnagram("rat","car")) pass++;
        if(sol.isAnagram("listen","silent")) pass++;

        System.out.println("RESULT:"+pass+"/3");
    }
}`,
  testCases:[
    {input:"anagram,nagaram",expectedOutput:"true"},
    {input:"rat,car",expectedOutput:"false"},
    {input:"listen,silent",expectedOutput:"true"}
  ]
},
{
  title: 'Contains Duplicate',
  difficulty: 'Easy',
  category: 'array',
  description: 'Return true if any value appears at least twice in the array.',
  starterCode: `class Solution {
    public boolean containsDuplicate(int[] nums) {

    }
}`,
  driverTemplate: `{{SOLUTION}}

public class Main{
    public static void main(String[] args){
        Solution sol=new Solution();

        int pass=0;

        if(sol.containsDuplicate(new int[]{1,2,3,1})) pass++;
        if(!sol.containsDuplicate(new int[]{1,2,3,4})) pass++;
        if(sol.containsDuplicate(new int[]{1,1,1,3,3,4,3,2,4,2})) pass++;

        System.out.println("RESULT:"+pass+"/3");
    }
}`,
  testCases:[
    {input:"[1,2,3,1]",expectedOutput:"true"},
    {input:"[1,2,3,4]",expectedOutput:"false"},
    {input:"[1,1,1,3,3,4,3,2,4,2]",expectedOutput:"true"}
  ]
},
{
  title: 'Move Zeroes',
  difficulty: 'Easy',
  category: 'array',
  description: 'Move all zeroes to the end while maintaining the relative order of non-zero elements.',
  starterCode: `class Solution {
    public void moveZeroes(int[] nums) {

    }
}`,
  driverTemplate: `import java.util.*;

{{SOLUTION}}

public class Main{
    public static void main(String[] args){
        Solution sol=new Solution();

        int pass=0;

        int[] a={0,1,0,3,12};
        sol.moveZeroes(a);
        if(Arrays.equals(a,new int[]{1,3,12,0,0})) pass++;

        int[] b={0};
        sol.moveZeroes(b);
        if(Arrays.equals(b,new int[]{0})) pass++;

        int[] c={1,0,2};
        sol.moveZeroes(c);
        if(Arrays.equals(c,new int[]{1,2,0})) pass++;

        System.out.println("RESULT:"+pass+"/3");
    }
}`,
  testCases:[
    {input:"[0,1,0,3,12]",expectedOutput:"[1,3,12,0,0]"},
    {input:"[0]",expectedOutput:"[0]"},
    {input:"[1,0,2]",expectedOutput:"[1,2,0]"}
  ]
}
];

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    await Problem.deleteMany({});
    await Problem.insertMany(problems);
    console.log(`Seeded ${problems.length} problems`);
    mongoose.disconnect();
  })
  .catch(err => console.error(err));