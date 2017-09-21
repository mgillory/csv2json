# csv2json
A CSV parser that outputs a JSON custom file using Node.js.
*Notes: No external libraries were used.*
## Parsing CSV
Each line of this comma-separated file is a data record. It turns out that our data might have comma in its content. With that in mind, it was used double or single quotes to distinguish such thing.
The parsing occurs line by line and below I'm gonna hightlight the main logic behind each column:
- **email**: It was used a regular expression that accepts email addresses defined in Internet Standards [RFC 5321](https://tools.ietf.org/html/rfc5321). Even if *"/"* is a valid character, it was used as a delimiter as seen by the input example.
- **phone**: The whole logic behind phone validation was build upon brazilian phone numbers. The logic is capable of identifying landline and mobile numbers and decide whether or not to concatenate the 9th digit or validate the phone number (landline -> [2-5] and mobile -> [6-9]). As seen on [ANATEL](http://www.anatel.gov.br/Portal/exibirPortalPaginaEspecial.do?org.apache.struts.taglib.html.TOKEN=9594e1d11fbc996d52bda44e608bb744&codItemCanal=1794&pastaSelecionada=2984)'s website, the 9th digit was fully implemented by the end of 2016. That's the reason for the key difference of the output file, where *Mary Doe 2's* number *(11) 98334228* was accepted and outputed as follows:
```js
"address": "5511998334228"
```
as oposed to ClassApp's [gist](https://gist.github.com/samin/3a75a44d94a8dbd48a95).
- **eid**: Basic check to validate if the given string is a valid number.
- **class**: Replacing common delimiters in order to get all the classes.
- **invisible**: It was used a boolean if.
- **see_all**: Same as above.
## Creating JSON
In order to create JSON file accordingly, a couple of awareness was necessary. The fact that we had to reassemble the object if we had the same *'address'* value, and the fact that we needed to keep some reference of that given object's id if we encountered multiple lines of the same id.
