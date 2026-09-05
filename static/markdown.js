// =====================================================
// MARKDOWN RENDERER
// =====================================================


function escapeHTML(text) {

    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// =====================================================
// INLINE MARKDOWN
// =====================================================

function renderInlineMarkdown(text) {

    let result =
        escapeHTML(text);


    result = result.replace(
        /`([^`]+)`/g,
        "<code>$1</code>"
    );


    result = result.replace(
        /\*\*(.+?)\*\*/g,
        "<strong>$1</strong>"
    );


    result = result.replace(
        /(?<!\*)\*(?!\s)(.+?)(?<!\s)\*(?!\*)/g,
        "<em>$1</em>"
    );


    result = result.replace(
        /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
    );


    return result;

}


// =====================================================
// CODE BLOCK
// =====================================================

function createCodeBlock(
    code,
    language
) {

    const wrapper =
        document.createElement("div");

    wrapper.className =
        "code-block";


    const header =
        document.createElement("div");

    header.className =
        "code-header";


    const languageElement =
        document.createElement("span");

    languageElement.className =
        "code-language";

    languageElement.textContent =
        language || "code";


    const copyButton =
        document.createElement("button");

    copyButton.className =
        "copy-code";

    copyButton.type =
        "button";

    copyButton.textContent =
        "Copy";


    copyButton.onclick =
        async function () {

            try {

                await navigator.clipboard.writeText(
                    code
                );

                copyButton.textContent =
                    "Copied!";

                setTimeout(
                    () => {
                        copyButton.textContent =
                            "Copy";
                    },
                    1500
                );

            }
            catch (error) {

                console.error(
                    "Copy failed:",
                    error
                );

            }

        };


    header.appendChild(
        languageElement
    );

    header.appendChild(
        copyButton
    );


    const pre =
        document.createElement("pre");


    const codeElement =
        document.createElement("code");


    codeElement.textContent =
        code;


    pre.appendChild(
        codeElement
    );


    wrapper.appendChild(
        header
    );

    wrapper.appendChild(
        pre
    );


    return wrapper;

}


// =====================================================
// MARKDOWN
// =====================================================

function renderMarkdown(text) {

    const container =
        document.createElement("div");

    container.className =
        "markdown-content";


    if (!text) {

        return container;

    }


    text =
        String(text)
            .replace(/\r\n/g, "\n");


    const lines =
        text.split("\n");


    let normalLines = [];

    let codeLines = [];

    let inCode = false;

    let language = "";


    function renderNormalText() {

        if (
            normalLines.length === 0
        ) {

            return;

        }


        const lines =
            normalLines;


        normalLines = [];


        let currentList = null;

        let currentListType = null;


        function closeList() {

            currentList = null;

            currentListType = null;

        }


        lines.forEach(
            function (line) {

                // Heading

                const heading =
                    line.match(
                        /^(#{1,6})\s+(.+)$/
                    );


                if (heading) {

                    closeList();


                    const level =
                        heading[1].length;


                    const element =
                        document.createElement(
                            `h${level}`
                        );


                    element.innerHTML =
                        renderInlineMarkdown(
                            heading[2]
                        );


                    container.appendChild(
                        element
                    );


                    return;

                }


                // Bullet

                const bullet =
                    line.match(
                        /^\s*[-*+]\s+(.+)$/
                    );


                if (bullet) {

                    if (
                        currentListType !==
                        "ul"
                    ) {

                        closeList();


                        currentList =
                            document.createElement(
                                "ul"
                            );


                        currentListType =
                            "ul";


                        container.appendChild(
                            currentList
                        );

                    }


                    const item =
                        document.createElement(
                            "li"
                        );


                    item.innerHTML =
                        renderInlineMarkdown(
                            bullet[1]
                        );


                    currentList.appendChild(
                        item
                    );


                    return;

                }


                // Numbered list

                const numbered =
                    line.match(
                        /^\s*\d+\.\s+(.+)$/
                    );


                if (numbered) {

                    if (
                        currentListType !==
                        "ol"
                    ) {

                        closeList();


                        currentList =
                            document.createElement(
                                "ol"
                            );


                        currentListType =
                            "ol";


                        container.appendChild(
                            currentList
                        );

                    }


                    const item =
                        document.createElement(
                            "li"
                        );


                    item.innerHTML =
                        renderInlineMarkdown(
                            numbered[1]
                        );


                    currentList.appendChild(
                        item
                    );


                    return;

                }


                // Empty line

                if (
                    line.trim() === ""
                ) {

                    closeList();

                    return;

                }


                // Normal paragraph

                closeList();


                const paragraph =
                    document.createElement(
                        "p"
                    );


                paragraph.innerHTML =
                    renderInlineMarkdown(
                        line
                    );


                container.appendChild(
                    paragraph
                );

            }
        );

    }


    lines.forEach(
        function (line) {

            // Start code

            if (
                !inCode &&
                line.trim().startsWith("```")
            ) {

                renderNormalText();


                inCode =
                    true;


                codeLines =
                    [];


                language =
                    line
                        .trim()
                        .substring(3)
                        .trim();


                return;

            }


            // End code

            if (
                inCode &&
                line.trim() === "```"
            ) {

                inCode =
                    false;


                container.appendChild(

                    createCodeBlock(

                        codeLines.join("\n"),

                        language

                    )

                );


                codeLines =
                    [];


                language =
                    "";


                return;

            }


            if (inCode) {

                codeLines.push(
                    line
                );

            }
            else {

                normalLines.push(
                    line
                );

            }

        }
    );


    // Handle unfinished streaming code

    if (inCode) {

        container.appendChild(

            createCodeBlock(

                codeLines.join("\n"),

                language

            )

        );

    }
    else {

        renderNormalText();

    }


    return container;

}


window.renderMarkdown =
    renderMarkdown;