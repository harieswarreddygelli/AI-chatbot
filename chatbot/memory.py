import json
import os


CHAT_FOLDER = "data/chats"


def get_chat_files():
    """Return all saved chat files."""

    os.makedirs(CHAT_FOLDER, exist_ok=True)

    files = [
        file
        for file in os.listdir(CHAT_FOLDER)
        if file.endswith(".json")
    ]

    return sorted(files)


def create_chat(title, personality_prompt):
    """Create a new chat."""

    os.makedirs(CHAT_FOLDER, exist_ok=True)

    files = get_chat_files()

    numbers = []

    for file in files:

        try:

            number = int(
                file.replace("chat_", "")
                    .replace(".json", "")
            )

            numbers.append(number)

        except ValueError:
            pass


    if numbers:

        chat_number = max(numbers) + 1

    else:

        chat_number = 1


    filename = f"chat_{chat_number}.json"


    data = {

        "title": title,

        "messages": [

            {
                "role": "system",

                "content": personality_prompt
            }

        ]

    }


    filepath = os.path.join(
        CHAT_FOLDER,
        filename
    )


    with open(
        filepath,
        "w",
        encoding="utf-8"
    ) as file:

        json.dump(
            data,
            file,
            indent=4,
            ensure_ascii=False
        )


    return filename


def load_chat(filename):
    """Load a chat."""

    filepath = os.path.join(
        CHAT_FOLDER,
        filename
    )


    if not os.path.exists(filepath):

        return None


    with open(
        filepath,
        "r",
        encoding="utf-8"
    ) as file:

        return json.load(file)


def save_chat(filename, title, messages):
    """Save a chat."""

    os.makedirs(
        CHAT_FOLDER,
        exist_ok=True
    )


    filepath = os.path.join(
        CHAT_FOLDER,
        filename
    )


    data = {

        "title": title,

        "messages": messages

    }


    with open(
        filepath,
        "w",
        encoding="utf-8"
    ) as file:

        json.dump(
            data,
            file,
            indent=4,
            ensure_ascii=False
        )


def delete_chat(filename):
    """Delete a chat."""

    filepath = os.path.join(
        CHAT_FOLDER,
        filename
    )


    if os.path.exists(filepath):

        os.remove(filepath)

        return True


    return False