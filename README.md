# Checkpoint

Filter tweets by following a users favourites. Can be used to safely share
tweets of a event to a large audience. 

## Tech Stuff

On startup fetch most recent 20 favourites and store them in a database. 
Start a connection to the streaming api and add all new favourites to the
database.

When a client connects to the socket.io endpoint give them the most recent 20
favourites. Then push any new favourites to them. 
