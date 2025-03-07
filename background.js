chrome.runtime.onInstalled.addListener(() => {
  console.log("AI Help Extension installed.")

  chrome.storage.local.get(["apiKey"], (result) => {
    if (!result.apiKey) {
      chrome.action.setPopup({ popup: "popup.html" })
    } else {
      chrome.action.setPopup({ popup: "popup.html" })
    }
  })
})

chrome.runtime.onConnect.addListener((port) => {
  if (port.name === "aiHelpPort") {
    console.log("AI help port connected")
    port.onMessage.addListener(async (request) => {
      if (request.action === "getAIResponse") {
        try {
          const aiResponse = await fetchAIResponse(request.message)
          port.postMessage({ response: aiResponse })
        } catch (error) {
          console.error("API call failed:", error)
          port.postMessage({ response: "Failed to fetch AI response. Please try again." })
        }
      }
    })
  } else if (port.name === "problemContextPort") {
    console.log("Problem context port connected")
    port.onMessage.addListener(async (request) => {
      if (request.action === "sendProblemContext") {
        try {
          const aiResponse = await fetchAIResponse(request.message)
          port.postMessage({ response: aiResponse })
        } catch (error) {
          console.error("Failed to send problem context:", error)
          port.postMessage({ response: "Failed to send problem context." })
        }
      }
    })
  }
})

async function fetchAIResponse(message) {
  try {
    const GEMINI_KEY = await new Promise((resolve, reject) => {
      chrome.storage.local.get(["apiKey"], (result) => {
        if (result.apiKey) {
          resolve(result.apiKey)
        } else {
          reject("API key not found")
        }
      })
    })

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: message }] }],
        }),
      },
    )

    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.status}`)
    }

    const data = await response.json()

    if (
      data &&
      data.candidates &&
      data.candidates[0] &&
      data.candidates[0].content &&
      data.candidates[0].content.parts &&
      data.candidates[0].content.parts[0].text
    ) {
      return data.candidates[0].content.parts[0].text
    } else {
      throw new Error("Unexpected response structure")
    }
  } catch (error) {
    console.error("Error in fetchAIResponse:", error)
    return "Sorry, I encountered an error. Please check your API key and try again."
  }
}

