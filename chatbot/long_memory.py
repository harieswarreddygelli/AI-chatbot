import json
import os
import re


# =====================================================
# MEMORY FILE
# =====================================================

MEMORY_FILE = "data/memory.json"


# =====================================================
# LOAD MEMORY
# =====================================================

def load_memory():

    if not os.path.exists(MEMORY_FILE):

        return {}

    try:

        with open(
            MEMORY_FILE,
            "r",
            encoding="utf-8"
        ) as file:

            data = json.load(file)


        if isinstance(data, dict):

            return data


    except Exception as error:

        print(
            "❌ Memory load error:",
            error
        )


    return {}


# =====================================================
# SAVE MEMORY
# =====================================================

def save_memory(memory):

    try:

        os.makedirs(
            "data",
            exist_ok=True
        )


        with open(
            MEMORY_FILE,
            "w",
            encoding="utf-8"
        ) as file:

            json.dump(
                memory,
                file,
                indent=4,
                ensure_ascii=False
            )


    except Exception as error:

        print(
            "❌ Memory save error:",
            error
        )


# =====================================================
# GET MEMORY TEXT
# =====================================================

def get_memory_text():

    memory = load_memory()


    if not memory:

        return "No stored user information."


    lines = []


    for key, value in memory.items():

        if isinstance(
            value,
            list
        ):

            value = ", ".join(
                str(item)
                for item in value
            )


        lines.append(
            f"{key}: {value}"
        )


    return "\n".join(
        lines
    )


# =====================================================
# ADD MEMORY
# =====================================================

def add_memory(
    key,
    value
):

    memory = load_memory()


    memory[key] = value


    save_memory(
        memory
    )


# =====================================================
# REMOVE MEMORY
# =====================================================

def remove_memory(
    key
):

    memory = load_memory()


    if key not in memory:

        return False


    del memory[key]


    save_memory(
        memory
    )


    return True


# =====================================================
# ADD TO LIST
# =====================================================

def add_to_list(
    memory,
    key,
    value
):

    if not value:

        return


    value = str(
        value
    ).strip()


    if not value:

        return


    if key not in memory:

        memory[key] = []


    if not isinstance(
        memory[key],
        list
    ):

        memory[key] = [
            memory[key]
        ]


    if value not in memory[key]:

        memory[key].append(
            value
        )


# =====================================================
# EXTRACT BASIC MEMORY
#
# NO GEMMA CALL HERE.
#
# This is intentional.
# =====================================================

def detect_basic_memories(
    message,
    memory
):

    text = message.strip()


    # =================================================
    # NAME
    # =================================================

    match = re.search(

        r"\bmy name is\s+"
        r"([A-Za-z][A-Za-z ]*)",

        text,

        re.IGNORECASE

    )


    if match:

        name = (
            match.group(1)
            .strip()
        )


        if name:

            # Remove accidental sentence text

            name = re.split(
                r"[.!?,]",
                name
            )[0].strip()


            memory[
                "user_name"
            ] = name


    # =================================================
    # CAREER GOAL
    # =================================================

    patterns = [

        r"\bmy career goal is\s+(.+?)(?:\.|$)",

        r"\bmy goal is\s+(.+?)(?:\.|$)",

        r"\bi want to become\s+(.+?)(?:\.|$)",

        r"\bi want a career in\s+(.+?)(?:\.|$)"

    ]


    for pattern in patterns:

        match = re.search(

            pattern,

            text,

            re.IGNORECASE

        )


        if match:

            goal = (
                match.group(1)
                .strip()
            )


            if goal:

                memory[
                    "career_goal"
                ] = goal


            break


    # =================================================
    # LEARNING
    # =================================================

    patterns = [

        r"\bi am learning\s+(.+?)(?:\.|$)",

        r"\bi'm learning\s+(.+?)(?:\.|$)",

        r"\bi am currently learning\s+(.+?)(?:\.|$)",

        r"\bi'm currently learning\s+(.+?)(?:\.|$)"

    ]


    for pattern in patterns:

        match = re.search(

            pattern,

            text,

            re.IGNORECASE

        )


        if match:

            subjects = (
                match.group(1)
                .strip()
            )


            # Split:
            # Python and DSA
            # Python, DSA

            subjects = re.split(

                r",|\band\b",

                subjects,

                flags=re.IGNORECASE

            )


            for subject in subjects:

                subject = (
                    subject.strip()
                )


                if subject:

                    add_to_list(

                        memory,

                        "learning",

                        subject

                    )


            break


    # =================================================
    # EDUCATION
    # =================================================

    patterns = [

        r"\bi am studying\s+(.+?)(?:\.|$)",

        r"\bi'm studying\s+(.+?)(?:\.|$)",

        r"\bi study\s+(.+?)(?:\.|$)"

    ]


    for pattern in patterns:

        match = re.search(

            pattern,

            text,

            re.IGNORECASE

        )


        if match:

            education = (
                match.group(1)
                .strip()
            )


            if education:

                memory[
                    "education"
                ] = education


            break


    # =================================================
    # LIKES
    # =================================================

    match = re.search(

        r"\bi like\s+(.+?)(?:\.|$)",

        text,

        re.IGNORECASE

    )


    if match:

        add_to_list(

            memory,

            "likes",

            match.group(1)

        )


    # =================================================
    # FAVORITES
    # =================================================

    match = re.search(

        r"\bmy favorite\s+(.+?)(?:\.|$)",

        text,

        re.IGNORECASE

    )


    if match:

        add_to_list(

            memory,

            "favorites",

            match.group(1)

        )


    # =================================================
    # PROJECTS
    # =================================================

    patterns = [

        r"\bmy project is\s+(.+?)(?:\.|$)",

        r"\bi am working on\s+(.+?)(?:\.|$)",

        r"\bi'm working on\s+(.+?)(?:\.|$)"

    ]


    for pattern in patterns:

        match = re.search(

            pattern,

            text,

            re.IGNORECASE

        )


        if match:

            add_to_list(

                memory,

                "projects",

                match.group(1)

            )


            break


# =====================================================
# REMEMBER USER MESSAGE
#
# IMPORTANT:
# This function DOES NOT call Gemma.
# =====================================================

def remember_user_message(
    message
):

    try:

        memory = load_memory()


        # Detect simple personal information

        detect_basic_memories(

            message,

            memory

        )


        # Save immediately

        save_memory(
            memory
        )


        print(
            "\n🧠 MEMORY UPDATED:"
        )


        print(
            json.dumps(

                memory,

                indent=4,

                ensure_ascii=False

            )
        )


    except Exception as error:

        print(
            "❌ Memory update error:",
            error
        )