+++
title = "How to tag people/groups in Slack using bot?"
date = 2023-10-19
type = "til"
description = "Hacky way of finding tag IDs"
in_search_index = true
[taxonomies]
tags = ["hack", "slack"]
+++

In slack, each group or users like `@devs-oncall` or others are assigned an ID, something like `U01EQW5V6AW`.


To mention a person using slack bot, for example:
```
“Can you check @tag-name?”
```


You will have to convert it to :
```
“Can you check <@U01EQW5V6AW>?”
```


To mention a group like `@devs-oncall`, the approach changes, for example:
```
“Can you check @devs-oncall?”
```

You will have to convert it to:

```
“Can you check <!subteam^S05S394E523> ?”

```


## How to find the IDs?

Generally, only slack admins can check the user’s ID, but there’s a hack for it as well:
1. Open slack in the browser and inspect the website.
2. Then open a chat in slack where that person or group is mentioned and inspect the CSS of that tag/mention, there you will find a label “data-member-id=”, the value of that label is the tag’s ID and *voila!*


### Reference links:
- [Stack-overflow ref](https://stackoverflow.com/questions/32419756/how-do-you-tag-people-with-a-slack-bot)



