# FlickPicker

This is a template for an application for Discord movie night that can be used
for a voting system. So that users can vote on through Discord, possibly Titch,
or through the app/website itself

## Technologies

This primarily uses HTML, CSS and JavaScript. The backend uses Express.
The UI library/framework is Bootstrap with FontAwesome via CDN on the index.html in the Frontend/client public directory

## Development

Best way to work on this at the moment is to install a live hot reload extension like in VSCode Five Server or Live Server and
open the index.html in Frontend/client/public. It might work partially in nodejs/express, but there isn't any
app.js // App.js or index.js yet on either side.

To serve everything in development without VSCode:

1. Start the backend server: `cd Backend/ && npm run start`
2. Host the root directory on a port other than 3000 using `python -m http.server 8080` or [live-server](https://www.npmjs.com/package/live-server) (if you want hot-reload).
3. Navigate to `localhost:8080/Frontend/client/public` in a browser

⚠️ **Important**
The frontend in `Frontend/client` is currently **not configured to run as a standalone
Webpack dev server**.
Although a `package.json` and Webpack scripts exist, the Webpack configuration and
entry point are incomplete. Running `npm start` inside `Frontend/client` will fail.
For now, frontend development is done by opening the static HTML files directly
(see instructions below) or by serving them via the backend.


## TODO

This project has plenty left to be done. If you would like to contribute to this project, you're welcome to contribute this

See: [View the TODO list](TODO.md)

If you don't see a feature you would like, open a Feature Request and submit one.

## Contributing

If you still see the Issue in the Issue tab it is still open.

If there is a bug and or something doesn't work as expected please let us know by submitting a [Bug] in the Issues tab.

A CONTRIBUTING.md will be added soon.

This site/application is fully open-source. Through community improvements we can make this site/application work the best that it can.

## LICENSE

MIT
