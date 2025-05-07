# Inbox Actions
Inbox Actions adds convenient interactions to your messages by detecting structured data (Microdata and JSON-LD) embedded in emails. It automatically surfaces actionable items directly in Thunderbird’s interface, allowing you to interact with services or perform tasks without even opening the email.

 ## Roadmap
 Pull requests that build towards these objectives are greatly appricated! All roadmap items should work for both json-ld and microdata

* Actions (https://developers.google.com/workspace/gmail/markup/actions/actions-overview)
  - [x] Add support for Go-To Actions
  - [x] Add support for One-Click Actions
* Highlights (https://developers.google.com/workspace/gmail/markup/highlights)
  - [ ] Bus reservation
  - [ ] Car rental reservation
  - [ ] Train reservation
  - [ ] Flight reservation
  - [ ] Order
  - [ ] Parcel delivery
  - [ ] Hotel reservation
  - [ ] Invoice
  - [ ] Restaurant reservation
  - [ ] Ticketed event reservation
  - [ ] Booking
  - [ ] Export to calander option

## Demo
Want to see it in action? Here's how:

1. **Download a Sample Email**  
   👉 [Click here to download a sample `.eml` file](https://media.fenriris.net/talI2/LOvEgano92.eml/raw) with structured data markup.

2. **Import the Email**  
   Open Thunderbird and drag-and-drop the downloaded `.eml` file into any folder in your mail client.

3. **Open the Message**  
   When you view the message, if the add-on is active, Inbox Actions will detect the structured markup and show actionable buttons (like “View Issue”) in the message toolbar or context menu.

4. **Click the Action**  
   Click the button to perform the action defined in the email — such as opening a GitHub issue or confirming a booking.

> 💡 Make sure Inbox Actions is installed and enabled in Thunderbird for this to work.

## Installing
### Download
You can download it from the [thunderbird addon](https://addons.thunderbird.net/EN-US/thunderbird/addon/inbox-actions) store, or from the [releases](https://github.com/SrS2225a/inbox-actions/releases) page

### Build it yourself
In the main project directory, run `npm run compile`. If successful inbox-actions.xpi will be created in /build 

## Credits
<a href="https://www.flaticon.com/free-icons/">Icons from Flaticon</a>

## Donate
Like the extension? Consider [donating](https://liberapay.com/Eris/donate) to support the development of the extension.
