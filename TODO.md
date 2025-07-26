[ ] Connection between React app and the extension
User can connect a DAT tab with the extension and thus, the React app as well. Since user can open many DAT tabs, we must limit the connection to only one DAT tab so that we dont break the workflow of the project.
On the react part (front end), there will be a component thats job is to listen for the DAT connection.
When the user clicks on the DAT the button to connect the tab with the extension, on the react part, it should display that the connection has been made.

- [ ] In the same component, make a button that when user clicks on it, the react app will send a message to the connected DAT tab, and on the DAT part, it will send back the some PING PONG type of message back on the REACT part.

[ ] Component for listing search-lines like power.dat.

- [+] Single search-line component
- [ ] Create new search-line
- [+] Associate drivers with a lane. Each lane should have multiple drivers, and we should be able to remove them as well.

[ ] Create new search-line

User will open Add New Search module, and will fill out the things over there, such as origin, destination, time window, etc. At the bottom of the module, there will be "Add to DAT" button, that will send all these informations to the connected DAT window in the browser. That message will be communicated via the extension, that will be listening on the content script on the DAT. Message is in json format, such as:

```json
{
  "msg_type": "DAT_ADD_NEW_LINE",
  "origin": "Chicago IL, 519219",
  "destination": "AL,FL,GA"
  // rest of the fields here, like Unique message ID, time window, etc
}
```

On the receiving end, on the content script part of the DAT, the listener will:

```text
// this is a pseudo code
if msg_type === DAT_ADD_NEW_LINE {
    "add a new lane" button.click();
    "origin input".select();
    "origin input".insert("519219");
    "origin input dropdown".select_first();

    "destination input".select();
    "destination input".insert("AL,FL,GA");
    "destination input dropdown".select_first();
    // do same for other fields

    "submit the lane" button.click();

    new_lane_id = "inserted lane id"

    "iframe container".select()
    new_iframe = "iframe container".create_new_iframe("https://one.dat.com/search-loads-ow")
    new_iframe.select_lane_id(new_lane_id)


}
```
