import json
import os


# =====================================================
# SUMMARY DIRECTORY
# =====================================================

SUMMARY_DIR = "data/summaries"


# =====================================================
# MAKE SURE DIRECTORY EXISTS
# =====================================================

def ensure_summary_directory():

    os.makedirs(
        SUMMARY_DIR,
        exist_ok=True
    )


# =====================================================
# GET SUMMARY FILE
# =====================================================

def get_summary_file(
    chat_id
):

    ensure_summary_directory()

    return os.path.join(
        SUMMARY_DIR,
        chat_id
    )


# =====================================================
# LOAD SUMMARY
# =====================================================

def load_summary(
    chat_id
):

    file_path = get_summary_file(
        chat_id
    )


    if not os.path.exists(
        file_path
    ):

        return ""


    try:

        with open(
            file_path,
            "r",
            encoding="utf-8"
        ) as file:

            data = json.load(
                file
            )


        if isinstance(
            data,
            dict
        ):

            return data.get(
                "summary",
                ""
            )


    except Exception as error:

        print(
            "Summary load error:",
            error
        )


    return ""


# =====================================================
# SAVE SUMMARY
# =====================================================

def save_summary(
    chat_id,
    summary
):

    ensure_summary_directory()


    file_path = get_summary_file(
        chat_id
    )


    data = {

        "summary":
            summary

    }


    try:

        with open(
            file_path,
            "w",
            encoding="utf-8"
        ) as file:

            json.dump(

                data,

                file,

                indent=4,

                ensure_ascii=False

            )


        print(
            "📝 Conversation summary saved."
        )


    except Exception as error:

        print(
            "Summary save error:",
            error
        )


# =====================================================
# DELETE SUMMARY
# =====================================================

def delete_summary(
    chat_id
):

    file_path = get_summary_file(
        chat_id
    )


    if os.path.exists(
        file_path
    ):

        try:

            os.remove(
                file_path
            )

            return True

        except Exception as error:

            print(
                "Summary delete error:",
                error
            )


    return False