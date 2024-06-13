## Install packages using 

```
npm install
```

## Run referee first on one terminal

```
npm run referee
```

## Start the championship by running next command in another terminal

```
npm run players
```

This will carry out the chanmpionship and create a report named championshipreport.csv which lists all the games, the final scores and the Champion.

Attaching an already generated report.

List of apis supported by referee and player

### referee.js

`
POST /join
`

Players use this api to join the championship


### player.js

`
POST /notify
`

Referee notifies about the players role

`
POST /play
`

Referee asks for a play from the player based on their role (attacker or defender)

`
POST /shutdown
`

Referee orders the player to shutdown if the player has lost the game or the championship has ended