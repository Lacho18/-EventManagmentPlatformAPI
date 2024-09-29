# Title

Event management system API

# Tech stack

## 1. NodeJS, 2. Express.js, 3. PostgreSQL, 4. node-cron

# Description

This is the server side of the event management system. This API handles all requests from the client side, process them and returns a formed and structured answer to the client. The server stores data in a relational database PostgreSQL. The queries that are executed on every controller are dynamically formatted with parameters that are send from the client side. The server creates a web socket server on port 8080 in order to supports real time application on places.

# Functionalities

1. Real time application - With web socket server on places of the app there is real time. The api supports real time chat application. The web socket is created when a client comes to the side and when logged in in his profile his web socket is stored in javascript Map() collection where the key is the user id. With this collection dynamically messages are send to the client.
2. Daily function - Events when created has date when they will be fulfilled. A function is called every time when 00:00 o'clock pass in order to check if events have fulfilled. If they are they are moved to table "passedEvents". This is done by module called 'node-cron', which calls every time a function on a given time.
3. HTTP request - in most routes all GET, POST, PUT and DELETE methods are active and described in their controller.

# Routes

| Route        | Method | Description                                                                                                                                                                                                                          |
| ------------ | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| /user        | GET    | Gets data for a user when correct email and password are given.                                                                                                                                                                      |
| /user        | POST   | Creates new user in the database, after correct input data.                                                                                                                                                                          |
| /user        | PUT    | Updates data about the user                                                                                                                                                                                                          |
| /user        | DELETE | Deletes user. This operation also deletes every event that the deleted user has created, if he is organizer, and every messages that he has sent.                                                                                    |
| /events      | GET    | Gets events data by given parameters, such as limit, conditions, join data.                                                                                                                                                          |
| /events      | POST   | Creates new event in the database, after correct input data.                                                                                                                                                                         |
| /events      | PUT    | Updates event data                                                                                                                                                                                                                   |
| /events      | DELETE | Deletes event from the database. If users has bought tickets for this deleted event money are brought back to the users.                                                                                                             |
| /saveEvent   | GET    | Adds event id to the saved array of specific user.                                                                                                                                                                                   |
| /saveEvent   | DELETE | Removes event id to the saved array of specific user.                                                                                                                                                                                |
| /chats       | GET    | Gets every messages in a selected chat, by location them with senderId and receiverId of a user.                                                                                                                                     |
| /chats       | POST   | Adds to the database the sended message.                                                                                                                                                                                             |
| /specUsers   | GET    | Gets the id, first name, last name, profile image and the role of every user in the database.                                                                                                                                        |
| /uploadImage | POST   | Creates a file in the public folder with the selected image from the user. In the database, the path to the image is saved.                                                                                                          |
| /uploadImage | PUT    | Updates the profile image of a user.                                                                                                                                                                                                 |
| /buyTicket   | POST   | Adds the price of the ticket to moneySpent field of the user and decrements the places field of the event with the amount of tickets that the user has purchased. Also adds the event id to the "willParticipate" field of the user. |
| /allUsers    | GET    | Gets everything for every user in the database.                                                                                                                                                                                      |

# Database

## Tables

1. users
2. upcomingEvents
3. passedEvents
4. chats

## Relations

1. users - chats (M : 1)
2. users - upcomingEvents (M : 1)
3. users - passedEvents (M : 1)

## Structure

1. users
   | id (PK) | email | password | firstName | lastName | dateOfBirth | chats | role | moneySpent | willParticipate | eventParticipate | gender | savedEvents | userImage |
   |---------|-------------|-----------|-----------|----------|-------------|-------------|-----------|------------|-----------------|------------------|--------|-------------|---------------------|
   | 18 | Ivan@abv.bg | 1qaz2wsx | Ivan | Ivanov | 2002-06-12 | [1, 12, 3] | organizer | 120 | [3, 8, 5] | [2, 7, 12] | male | [3, 8, 2] | /public/image.jpg |

2. upcomingEvents
   | id (PK) | name | description | location | duration | price | organizer_ID (FK) | image | events_date | places | participants |
   |---------|------|-------------|----------|----------|-------|-------------------|-------|-------------|--------|--------------|
   | 3 | Concert of Ariana Grande | Description of the event | ["England", "London", "London Eye"] | 4 h | 120 | 18 | [URL, URL, URL] | 2025-04-12 | 3000 | [2, 7, 11, 30] |

3. chats
   | id (PK) | senderId (FK) | receiverId (FK) | message | time_of_send |
   |---------|---------------|-----------------|---------|--------------|
   | 30514 | 12 | 1 | "Hello" | 2024-09-27 |

4. passedEvents - The structure is exactly the same as upcomingEvents table
