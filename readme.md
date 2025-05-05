# Weedify Frontend Repository

# Weedify - Recipe Sharing Application

## Description

### Weedify is a mobile recipe-sharing application where users can discover, share, and save recipes. The application serves as a community space for food enthusiasts to explore diverse culinary creations, find recipes based on their dietary preferences and get inspiration for new cooking ideas. Users can create personalized profiles, share their own recipes, and interact with content through comments, ratings, and favorites.

## Key features and functionality

### User management

- User profiles: Create and customize personal profile with a profile picture and bio information. Username, email and password can also be updated.
- Dietary preferences: Users can set their dietary restrictions/preferences.
- Social interactions: Follow other users and view their recipes, comment and rate other user's recipes.
- Notifications: Receive notifications of new followers, likes, ratings or comments on your posts.

### Recipe sharing

- Recipe management: Post, edit, and delete your own recipes.
- Recipe creation: Add recipes with title, image/video, ingredients, instructions, dietary information, estimated cooking time, portions and difficulty level.
- Ingredients management: Detailed ingredient lists with measurements, units and nutrition informaion.
- Dietary info: Tag recipes with appropriate dietary categories (vegan, gluten-free, etc.).

### Discovery and interaction

- Main feed: Browse recipes from other users in a scrollable feed, view detailed recipe information.
- Rating system: Rate recipes and view average ratings.
- Comments: Discuss or ask questions about recipes through a comment system with reply functionality.
- Favorites: Save your favorite recipes for quick access.
- Like: Like/unlike recipes.
- Follow: follow/unfollow other users.

### Search and filtering

- Recipe search: Find recipes based on ingredients, dietary restrictions, or keywords.
- Ingredient search: Look for recipes that use specific ingredients.
- Filtering options: Filter content based on dietary preferences, cooking time or difficulty level.
- Sorting: Sort recipes based on likes, ratings or timestamp.

### Security and user Control

- Authentication: Secure registration system and login with JWT authentication.
- Profile Management: Update personal information and preferences.
- Content Moderation: Users can manage their content. Admin can manage all content.

---

## Technical requirements and references

### Frontend

- React Native: Mobile application framework
- Expo: Development toolchain for React Native
- React Navigation: Navigation library
- Context API: For state management across components
- Zustand - State management

### UI components

- React Native Elements: UI component library
- Expo Linear Gradient: For gradient backgrounds
- React Native Vector Icons: Icon library
- Custom Components: Specialized components for recipes, comments, login etc.
- Airbnb starrating: Used to add and display ratings
- Multiselect and selector: Selecting diettypes and units.

### Form handling & validation

- React Hook Form: For managing form state and validation
- Custom validation logic for recipes, user profiles, and comments
- Input control for different data types (numeric, text, etc.)

### Media Processing

- Image picker integration for recipe photos
- Video player component for recipe videos
- Nutrition data calculation and display

### Backend Integration

- REST API Integration: Communication with backend services
- AsyncStorage: Local data persistence
- File/Image Upload: Support for uploading media content

### Testing

- Maestro: UI testing framework for automated test scenarios

### References

- **[React Native documentation](https://reactnative.dev/)**
- **[Expo documentation](https://docs.expo.dev/)**
- **[Native packages](https://www.npmjs.com/)**
- **[Selector](https://www.npmjs.com/package/react-native-dropdown-select-list)**
- **[Multi selector](https://www.npmjs.com/package/react-native-multiple-select)**
- **[How-test-with-maestro](https://www.youtube.com/watch?v=QGOAQVSxpDE)**
-

---

## Setup Instructions

### Installation

1. Clone the repository using `git clone https://github.com/karripar/weedify-frontend.git` in your terminal.

2. Install the required packages: <br>
   Make sure you have node.js installed and run: <br>
   `npm install` (may need `--legacy-peer-deps` to resolve dependency issues) to install all the necessary packages.

3. Set Environment Variables Create a .env file with the following variables:

`EXPO_PUBLIC_AUTH_API=<backend-auth-api-url> `<br>
`EXPO_PUBLIC_MEDIA_API=<backend-media-api-url> `<br>
`EXPO_PUBLIC_UPLOAD_API=<backend-upload-api-url> `<br>
`EXPO_PUBLIC_UPLOADS=<media-uploads-url> `<br>

4. Start the Development Server

`npx expo start`

---

## Testing

### Run automated tests using Maestro:

`maestro test ./maestro/<test-file>.yaml`

## Available tests:

- User registration: register.yaml
- User login: login.yaml
- Posting recipes: postrecipe_success.yaml
- Adding comments: docomment.yaml
- Editing recipes: editrecipe.yaml
- Managing favorites: addfavorite.yaml
- User profile updates: user-update.yaml
- Like/unlike features: likerecipe.yaml
- Recipe ratings: raterecipe.yaml

**[Testcases](https://github.com/karripar/weedify-frontend/tree/main/maestro/screenshots)**

## Related Repositories: <br>

**[Backend Repository](https://github.com/karripar/weedify-backend)** <br>
**[Hybrid TypeScript Types](https://github.com/karripar/weedify-types)** <br>

Visualized json structure of comments with replies:

```json
[
  {
    "comment_id": 1,
    "text": "Top Level Comment A",
    "replies": [
      {
        "comment_id": 2,
        "text": "Reply to A",
        "replies": [
          {
            "comment_id": 4,
            "text": "Reply to reply",
            "replies": []
          }
        ]
      },
      {
        "comment_id": 3,
        "text": "Another reply to A",
        "replies": []
      }
    ]
  },
  {
    "comment_id": 5,
    "text": "Top level B",
    "replies": []
  }
]
```

## Screenshots of the user interface

[Weedify](screenshots)

## Wireframes on Figma

**[Prototype](https://www.figma.com/design/iAuuXnq3lfXxhCwRMI3c14/Weedify?node-id=23-2&t=AnTcnKbJIfVoM1Gm-1)**

