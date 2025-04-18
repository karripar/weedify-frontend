# Weedify Frontend Repository

---

## Installation

1. Clone the repository using `git clone <repository url>` in your terminal (eg. Git Bash or whatever)

2. Install the required packages: <br>
Make sure you have node.js installed and run: <br>
`npm install` to install all the necessary packages.

---

## Links: <br>
**[Backend Repository](https://github.com/karripar/weedify-backend)** <br>
**[Hybrid TypeScript Types](https://github.com/karripar/weedify-types)** <br>

Visualized structure of comments with replies:
```json
[
  {
    comment_id: 1,
    text: "Top level A",
    replies: [
      {
        comment_id: 2,
        text: "Reply to A",
        replies: [
          {
            comment_id: 4,
            text: "Reply to reply",
            replies: []
          }
        ]
      },
      {
        comment_id: 3,
        text: "Another reply to A",
        replies: []
      }
    ]
  },
  {
    comment_id: 5,
    text: "Top level B",
    replies: []
  }
]
```


