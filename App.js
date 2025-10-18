import React, { useState, useMemo, useEffect, useRef } from 'react';
import { INITIAL_CHANNELS, RECHARGE_AMOUNTS, FILES_FOR_ZIP } from './constants.js';
import { TelegramIcon, CheckCircleIcon, DiamondIcon, StarIcon, ArrowRightIcon } from './components/icons.js';
import { AdminPanel } from './components/AdminPanel.js';

// JSZip and Babel are imported from script tags in index.html

const ConfirmationScreen = () => /*#__PURE__*/React.createElement("div", {
  className: "flex flex-col items-center justify-center text-center p-8 md:p-12"
}, /*#__PURE__*/React.createElement(CheckCircleIcon, {
  className: "w-20 h-20 text-green-400 mb-6 animate-scale-in"
}), /*#__PURE__*/React.createElement("h2", {
  className: "text-3xl font-bold text-white mb-3"
}, "Submission Received!"), /*#__PURE__*/React.createElement("p", {
  className: "text-gray-400 max-w-md"
}, "Your details are under review. Rewards are processed shortly. Thank you for your participation in the VIP Earning Hub."));
const AnimatedConfirmationScreen = () => {
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);
  return /*#__PURE__*/React.createElement("div", {
    className: "min-h-screen flex items-center justify-center p-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: `w-full max-w-lg bg-black/30 backdrop-blur-2xl rounded-2xl border border-orange-500/30 shadow-2xl shadow-orange-500/20 transform transition-all duration-500 ease-out ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`
  }, /*#__PURE__*/React.createElement(ConfirmationScreen, null)));
};
export default function App() {
  const [selectedAmount, setSelectedAmount] = useState(null);
  const [userName, setUserName] = useState('');
  const [upiId, setUpiId] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [visitedChannels, setVisitedChannels] = useState(new Set());
  const [isAdminView, setIsAdminView] = useState(false);
  const [channels, setChannels] = useState(INITIAL_CHANNELS);
  const [submissions, setSubmissions] = useState([]);
  const [channelClicks, setChannelClicks] = useState({});
  const [view, setView] = useState('tasks');

  // Secret admin toggle logic
  const [headerClicks, setHeaderClicks] = useState(0);
  const clickTimeoutRef = useRef(null);
  useEffect(() => {
    try {
      const storedSubmissions = localStorage.getItem('telegram-task-submissions');
      if (storedSubmissions) {
        setSubmissions(JSON.parse(storedSubmissions));
      }
      const storedClicks = localStorage.getItem('telegram-task-channel-clicks');
      if (storedClicks) {
        setChannelClicks(JSON.parse(storedClicks));
      }
    } catch (error) {
      console.error("Failed to load data from local storage", error);
    }
  }, []);
  const updateSubmissions = newSubmissions => {
    setSubmissions(newSubmissions);
    try {
      localStorage.setItem('telegram-task-submissions', JSON.stringify(newSubmissions));
    } catch (error) {
      console.error("Failed to save submissions to local storage", error);
    }
  };
  const updateChannelClicks = newClicks => {
    setChannelClicks(newClicks);
    try {
      localStorage.setItem('telegram-task-channel-clicks', JSON.stringify(newClicks));
    } catch (error) {
      console.error("Failed to save channel clicks to local storage", error);
    }
  };
  const allChannelsVisited = useMemo(() => visitedChannels.size === channels.length, [visitedChannels, channels]);
  const isFormValid = useMemo(() => {
    const isUpiValid = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(upiId);
    return userName.trim().length > 2 && isUpiValid && selectedAmount !== null;
  }, [userName, upiId, selectedAmount]);
  const handleChannelClick = channelUrl => {
    setVisitedChannels(prev => new Set(prev).add(channelUrl));
    const newClicks = {
      ...channelClicks
    };
    newClicks[channelUrl] = (newClicks[channelUrl] || 0) + 1;
    updateChannelClicks(newClicks);
  };
  const handleHeaderClick = () => {
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }
    const newClickCount = headerClicks + 1;
    if (newClickCount >= 5) {
      setIsAdminView(prev => !prev);
      setHeaderClicks(0);
    } else {
      setHeaderClicks(newClickCount);
      clickTimeoutRef.current = window.setTimeout(() => {
        setHeaderClicks(0);
      }, 1500); // Reset after 1.5 seconds
    }
  };
  const handleAddChannel = newChannel => {
    const newChannelObj = {
      name: newChannel.split('/').pop() || 'New Channel',
      url: newChannel
    };
    if (newChannel.trim() && !channels.some(c => c.url === newChannelObj.url)) {
      setChannels([...channels, newChannelObj]);
    }
  };
  const handleRemoveChannel = channelToRemove => {
    setChannels(channels.filter(channel => channel.url !== channelToRemove));
    const newClicks = {
      ...channelClicks
    };
    delete newClicks[channelToRemove];
    updateChannelClicks(newClicks);
  };
  const handleDownloadZip = async () => {
    const zip = new JSZip();

    // Create the dynamic constants file content for the deployed app.
    // It only includes channels and amounts, not the entire source code.
    const constantsFileContent = `export const INITIAL_CHANNELS = ${JSON.stringify(channels, null, 2)};
export const RECHARGE_AMOUNTS = ${JSON.stringify(RECHARGE_AMOUNTS)};
`;
    const allFiles = {
      ...FILES_FOR_ZIP,
      'constants.js': constantsFileContent
    };
    try {
      for (const [filePath, rawContent] of Object.entries(allFiles)) {
        if (filePath.endsWith('.js') || filePath.endsWith('.js')) {
          // Transpile TS/TSX to JS using Babel Standalone
          const contentWithJsImports = rawContent.replace(/\.js'/g, ".js'").replace(/\.js'/g, ".js'").replace(/\.js"/g, '.js"').replace(/\.js"/g, '.js"');
          const result = Babel.transform(contentWithJsImports, {
            presets: ["react", "typescript"],
            filename: filePath
          }).code;
          const newFilePath = filePath.replace(/\.tsx?$/, '.js');
          zip.file(newFilePath, result);
        } else if (filePath === 'index.html') {
          // Create a production-ready index.html that uses the transpiled JS
          const productionHtml = FILES_FOR_ZIP['index.html'].replace(/<script src="https:\/\/unpkg.com\/@babel\/standalone\/babel.min.js"><\/script>/, '').replace(/<script type="text\/babel" data-type="module" src="\/index.js"><\/script>/, '<script type="module" src="/index.js"><\/script>');
          zip.file(filePath, productionHtml);
        } else {
          // Add other files as-is
          zip.file(filePath, rawContent);
        }
      }
    } catch (error) {
      console.error("Failed to transpile and create ZIP file:", error);
      alert("An error occurred while preparing the download. Please check the console for details.");
      return;
    }

    // Generate and trigger the download
    zip.generateAsync({
      type: 'blob'
    }).then(function (content) {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = 'telegram-loot-task-dist.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };
  const handleSubmit = e => {
    e.preventDefault();
    if (isFormValid && selectedAmount) {
      const newSubmission = {
        id: `sub_${new Date().getTime()}`,
        userName,
        upiId,
        selectedAmount,
        timestamp: new Date().getTime(),
        status: 'pending'
      };
      updateSubmissions([...submissions, newSubmission]);
      setIsSubmitted(true);
    }
  };
  const handleUpdateSubmissionStatus = (id, status) => {
    const updatedSubmissions = submissions.map(sub => sub.id === id ? {
      ...sub,
      status
    } : sub);
    updateSubmissions(updatedSubmissions);
  };
  if (isSubmitted) {
    return /*#__PURE__*/React.createElement(AnimatedConfirmationScreen, null);
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "min-h-screen flex items-center justify-center p-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-full max-w-lg"
  }, isAdminView ? /*#__PURE__*/React.createElement("div", {
    className: "bg-black/30 backdrop-blur-2xl rounded-2xl border border-cyan-500/30 shadow-2xl shadow-cyan-500/20 overflow-hidden"
  }, /*#__PURE__*/React.createElement("header", {
    className: "relative p-4 border-b border-cyan-900/50 flex justify-center items-center"
  }, /*#__PURE__*/React.createElement("h1", {
    className: "text-xl font-bold text-white tracking-tight"
  }, "Admin Control Panel")), /*#__PURE__*/React.createElement(AdminPanel, {
    channels: channels.map(c => c.url),
    onAddChannel: handleAddChannel,
    onRemoveChannel: handleRemoveChannel,
    onDownloadZip: handleDownloadZip,
    submissions: submissions,
    onUpdateStatus: handleUpdateSubmissionStatus,
    channelClicks: channelClicks,
    rechargeAmounts: RECHARGE_AMOUNTS
  })) : /*#__PURE__*/React.createElement("div", {
    className: "space-y-8"
  }, /*#__PURE__*/React.createElement("header", {
    className: "text-center space-y-2 cursor-pointer",
    onClick: handleHeaderClick,
    title: "Click 5 times to toggle admin panel"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-center gap-3"
  }, /*#__PURE__*/React.createElement(DiamondIcon, {
    className: "w-8 h-8 text-orange-300"
  }), /*#__PURE__*/React.createElement("h1", {
    className: "text-5xl font-poppins font-bold tracking-wide text-gradient bg-gradient-to-r from-red-500 via-orange-400 to-amber-300"
  }, "VIP Earning Hub")), /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-orange-300/80"
  }, "Real Tasks \u2022 Manual Approval \u2022 Secure Payments")), view === 'tasks' ? /*#__PURE__*/React.createElement("main", {
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "space-y-4"
  }, channels.map((channel, index) => {
    const isVisited = visitedChannels.has(channel.url);
    return /*#__PURE__*/React.createElement("div", {
      key: index,
      className: "bg-gradient-to-br from-red-500/50 to-orange-500/50 rounded-2xl p-px transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/30"
    }, /*#__PURE__*/React.createElement("div", {
      className: "relative bg-slate-900/80 backdrop-blur-md rounded-[15px] p-4 overflow-hidden"
    }, /*#__PURE__*/React.createElement("div", {
      className: "absolute top-3 right-3 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg px-2.5 py-1 text-xs font-bold text-white shadow-lg"
    }, "+ \u20B91"), /*#__PURE__*/React.createElement("div", {
      className: "flex items-center gap-4"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-md"
    }, /*#__PURE__*/React.createElement(TelegramIcon, {
      className: "w-7 h-7 text-white"
    })), /*#__PURE__*/React.createElement("div", {
      className: "flex-1"
    }, /*#__PURE__*/React.createElement("h3", {
      className: "font-bold text-white text-lg"
    }, channel.name), /*#__PURE__*/React.createElement("p", {
      className: "text-sm text-orange-300/80"
    }, "Join to claim your instant reward"), /*#__PURE__*/React.createElement("div", {
      className: "flex items-center gap-2 mt-1"
    }, /*#__PURE__*/React.createElement("span", {
      className: "flex items-center gap-1 text-xs text-green-300 bg-green-500/20 px-2 py-0.5 rounded-full border border-green-400/30"
    }, /*#__PURE__*/React.createElement(CheckCircleIcon, {
      className: "w-3 h-3"
    }), " Verified"), /*#__PURE__*/React.createElement("span", {
      className: "text-xs text-yellow-300"
    }, "\uD83D\uDD25 Limited Slots Available!"))), /*#__PURE__*/React.createElement("div", {
      className: "flex-shrink-0"
    }, /*#__PURE__*/React.createElement("a", {
      href: channel.url,
      onClick: () => handleChannelClick(channel.url),
      target: "_blank",
      rel: "noopener noreferrer",
      className: `flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold rounded-full transition-all duration-300 transform shadow-lg w-44 ${isVisited ? 'bg-gradient-to-r from-emerald-500 to-green-400 text-white cursor-default btn-glow-green' : 'bg-gradient-to-r from-red-600 to-orange-500 text-white hover:shadow-xl hover:shadow-orange-500/30 hover:animate-[pulse-lite_1.5s_ease-in-out_infinite]'}`
    }, isVisited ? /*#__PURE__*/React.createElement(React.Fragment, null, " ", /*#__PURE__*/React.createElement(CheckCircleIcon, {
      className: "w-5 h-5 animate-scale-in"
    }), " ", /*#__PURE__*/React.createElement("span", null, "Completed!"), " ") : /*#__PURE__*/React.createElement(React.Fragment, null, " ", /*#__PURE__*/React.createElement("span", null, "Join & Earn \u20B91"), " ", /*#__PURE__*/React.createElement(ArrowRightIcon, {
      className: "w-4 h-4"
    }), " ")))), /*#__PURE__*/React.createElement("div", {
      className: "mt-4"
    }, /*#__PURE__*/React.createElement("span", {
      className: "bg-yellow-500/20 border border-yellow-400/30 text-yellow-300 text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1.5 w-fit"
    }, /*#__PURE__*/React.createElement(StarIcon, {
      className: "w-3.5 h-3.5"
    }), " Premium Task"))));
  })), /*#__PURE__*/React.createElement("button", {
    onClick: () => setView('details'),
    disabled: !allChannelsVisited,
    className: `w-full text-white font-bold py-3.5 rounded-lg transition-all duration-300 disabled:cursor-not-allowed transform hover:scale-[1.02] ${allChannelsVisited ? 'bg-gradient-to-r from-red-600 to-orange-500 hover:shadow-xl hover:shadow-orange-500/30' : 'bg-gray-800/50 border border-gray-700'}`
  }, "All Tasks Completed, Claim Reward"), !allChannelsVisited && /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-center text-gray-500 mt-2"
  }, "Complete all tasks to unlock the claim button.")) : /*#__PURE__*/React.createElement("form", {
    onSubmit: handleSubmit,
    className: "flex flex-col gap-6 bg-black/30 backdrop-blur-2xl rounded-2xl border border-orange-500/30 shadow-2xl shadow-orange-500/20 p-8"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-center"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "text-3xl font-bold text-white"
  }, "Enter Your Details"), /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-gray-400 mt-1"
  }, "Provide your details to receive the payment.")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-sm font-medium text-orange-300 mb-2"
  }, "Select Reward Amount"), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap gap-3"
  }, RECHARGE_AMOUNTS.map(amount => /*#__PURE__*/React.createElement("button", {
    key: amount,
    type: "button",
    onClick: () => setSelectedAmount(amount),
    className: `px-4 py-2 text-sm font-semibold rounded-full transition-all duration-200 border-2 ${selectedAmount === amount ? 'bg-red-600 border-orange-400 text-white scale-105 shadow-[0_0_15px_rgba(249,115,22,0.5)]' : 'bg-red-900/50 border-orange-700 text-orange-200 hover:border-orange-500'}`
  }, `₹${amount}`)))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    htmlFor: "userName",
    className: "block text-sm font-medium text-orange-300 mb-2"
  }, "Your Name"), /*#__PURE__*/React.createElement("div", {
    className: "p-px rounded-md bg-gradient-to-r from-orange-700/50 to-transparent focus-within:from-red-500 focus-within:to-orange-400 transition-all duration-300"
  }, /*#__PURE__*/React.createElement("input", {
    id: "userName",
    type: "text",
    value: userName,
    onChange: e => setUserName(e.target.value),
    placeholder: "Enter your full name",
    className: "w-full p-3 bg-black/80 border-0 rounded-[6px] text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-0",
    required: true,
    minLength: 3
  }))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    htmlFor: "upiId",
    className: "block text-sm font-medium text-orange-300 mb-2"
  }, "UPI ID"), /*#__PURE__*/React.createElement("div", {
    className: "p-px rounded-md bg-gradient-to-r from-orange-700/50 to-transparent focus-within:from-red-500 focus-within:to-orange-400 transition-all duration-300"
  }, /*#__PURE__*/React.createElement("input", {
    id: "upiId",
    type: "text",
    value: upiId,
    onChange: e => setUpiId(e.target.value),
    placeholder: "yourname@bank",
    className: "w-full p-3 bg-black/80 border-0 rounded-[6px] text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-0",
    required: true,
    pattern: "^[a-zA-Z0-9.\\-_]{2,256}@[a-zA-Z]{2,64}$"
  }))), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    disabled: !isFormValid,
    className: "w-full py-3.5 bg-gradient-to-r from-red-600 to-orange-500 text-white rounded-md text-lg font-bold transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/40 hover:scale-[1.02] disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed disabled:scale-100 disabled:shadow-none"
  }, "Submit Details")))));
}