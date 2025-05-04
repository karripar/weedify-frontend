# Weedify Frontend Repository

# Weedify - Recipe Sharing Application

## Description

### Weedify is a mobile recipe-sharing application where users can discover, share, and save recipes. The application serves as a community space for food enthusiasts to explore diverse culinary creations, find recipes based on their dietary preferences and get inspiration for new cooking ideas. Users can create personalized profiles, share their own recipes, and interact with content through comments, ratings, and favorites.

## Key features and functionality

### User profile and community

- User profiles: Create and customize personal profile with a profile picture and bio information.
- Dietary preferences: Users can set their dietary restrictions/preferences.
- Recipe management: Post, edit, and delete your own recipes.
- Social interactions: Follow other users and view their recipes, comment and rate other user's recipes.
- Notifications: Receive notifications of new followers, likes, ratings or comments on your posts.

### Recipe sharing

- Recipe creation: Add recipes with title, image/video, ingredients, instructions, dietary information, estimated cooking time, portions and difficulty level.
- Ingredients management: Detailed ingredient lists with measurements, units and nutrition informaion.
- Dietary info: Tag recipes with appropriate dietary categories (vegan, gluten-free, etc.).

### Discovery and interaction

- Main feed: Browse recipes from other users in a scrollable feed, view single recipes.
- Rating system: Rate recipes and view average ratings.
- Comments: Discuss or ask questions about recipes through a comment system with reply functionality.
- Favorites: Save your favorite recipes for quick access.
- Like: Like recipes.

### Search and filtering

- Recipe search: Find recipes based on ingredients, dietary restrictions, or keywords.
- Ingredient search: Look for recipes that use specific ingredients.
- Filtering options: Filter content based on dietary preferences, cooking time or difficulty level.
- Sorting: Sort recipes based on likes, ratings or timestamp.

### Security and user Control

- Authentication: Secure login and registration system.
- Profile Management: Update personal information and preferences.
- Content Moderation: Users can manage their content. Admin can manage all content.

---

## Technical requirements

### Frontend

- React Native: Cross-platform mobile application framework
- Expo: Development toolchain for React Native
- React Navigation: Navigation library for screen management
- Context API: For state management across components

### UI components

- React Native Elements (@rneui): UI component library
- Expo Linear Gradient: For gradient backgrounds
- React Native Vector Icons: Icon library
- Custom Components: Specialized components for recipes, comments, login etc.
- Airbnb starrating: Used to add and display ratings

### Form handling & validation

- React Hook Form: For managing form state and validation
- Custom validation logic for recipes, user profiles, and comments
- Input control patterns for different data types (numeric, text, etc.)

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

---

## Setup Instructions

### Installation

1. Clone the repository using `git clone https://github.com/karripar/weedify-frontend.git` in your terminal.

2. Install the required packages: <br>
   Make sure you have node.js installed and run: <br>
   `npm install` (may need `--legacy-peer-deps` to resolve dependency issues) to install all the necessary packages.

3. Set Environment Variables Create a .env file with the following variables:

```json
EXPO_PUBLIC_AUTH_API=<backend-auth-api-url>
EXPO_PUBLIC_MEDIA_API=<backend-media-api-url>
EXPO_PUBLIC_UPLOAD_API=<backend-upload-api-url>
EXPO_PUBLIC_UPLOADS=<media-uploads-url>
```

4. Start the Development Server

`npx expo start`

---

## Testing

### Run automated tests using Maestro:

`maestro test ./maestro/<test-file>.yaml`

## Available test scenarios:

- Login/Registration
- Recipe posting and editing
- Adding favorites
- User profile updates
- Commenting on recipes
- Like and unlike a recipe
- Rate a recipe and delete your rating

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

## kuvankaappaukset mobiilikäyttöliittymästä

[Weedify](screenshots)
