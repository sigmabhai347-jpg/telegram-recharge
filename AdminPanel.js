import React, { useState, useMemo } from 'react';
import { TrashIcon, PlusIcon, ArrowDownTrayIcon, CheckCircleIcon, XCircleIcon, ClockIcon, CursorClickIcon, ShareIcon, SparklesIcon, ClipboardIcon, ArrowPathIcon, ChartBarIcon } from './icons.js';
import { generateStyledMessage } from '../services/geminiService.js';
const AdminTab = ({
  active,
  onClick,
  children,
  count
}) => /*#__PURE__*/React.createElement("button", {
  onClick: onClick,
  className: `relative px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors focus:outline-none ${active ? 'bg-cyan-900/50 text-white border-b-2 border-cyan-500' : 'text-cyan-300 hover:bg-cyan-900/30'}`
}, children, count !== undefined && count > 0 && /*#__PURE__*/React.createElement("span", {
  className: "absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center border-2 border-[#0F0529]"
}, count > 9 ? '9+' : count));
const StatusBadge = ({
  status
}) => {
  const statusStyles = {
    pending: {
      text: 'Pending',
      color: 'yellow',
      Icon: ClockIcon
    },
    approved: {
      text: 'Approved',
      color: 'green',
      Icon: CheckCircleIcon
    },
    rejected: {
      text: 'Rejected',
      color: 'red',
      Icon: XCircleIcon
    }
  };
  const {
    text,
    color,
    Icon
  } = statusStyles[status];
  return /*#__PURE__*/React.createElement("span", {
    className: `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-${color}-500/20 text-${color}-300`
  }, /*#__PURE__*/React.createElement(Icon, {
    className: "w-4 h-4"
  }), text);
};
const StatCard = ({
  title,
  value,
  customClasses
}) => /*#__PURE__*/React.createElement("div", {
  className: `p-4 rounded-xl border ${customClasses}`
}, /*#__PURE__*/React.createElement("p", {
  className: "text-sm text-gray-300"
}, title), /*#__PURE__*/React.createElement("p", {
  className: "text-2xl font-bold text-white mt-1"
}, value));
const ChannelPerformanceChart = ({
  channelClicks
}) => {
  const sortedChannels = useMemo(() => {
    // Fix: Cast the result of Object.entries to ensure 'clicks' is treated as a number,
    // preventing type errors in the sort function due to 'any' type from JSON.parse.
    return Object.entries(channelClicks).map(([url, clicks]) => ({
      url,
      clicks
    })).sort((a, b) => b.clicks - a.clicks);
  }, [channelClicks]);
  if (sortedChannels.length === 0) {
    return /*#__PURE__*/React.createElement("p", {
      className: "text-gray-500 text-center py-8"
    }, "No channel click data yet.");
  }
  const maxClicks = Math.max(...sortedChannels.map(c => c.clicks), 1);
  return /*#__PURE__*/React.createElement("div", {
    className: "space-y-3"
  }, sortedChannels.map(({
    url,
    clicks
  }) => /*#__PURE__*/React.createElement("div", {
    key: url,
    className: "flex items-center gap-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-1/3 truncate text-sm text-gray-300",
    title: url
  }, url.split('/').pop() || url), /*#__PURE__*/React.createElement("div", {
    className: "w-2/3 bg-black/20 rounded-full border border-cyan-900/50"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-right py-1 px-2 rounded-full text-xs font-bold text-white",
    style: {
      width: `${clicks / maxClicks * 100}%`
    }
  }, clicks)))));
};
export const AdminPanel = ({
  channels,
  onAddChannel,
  onRemoveChannel,
  onDownloadZip,
  submissions,
  onUpdateStatus,
  channelClicks,
  rechargeAmounts
}) => {
  const [activeTab, setActiveTab] = useState('tasks');
  const [newChannel, setNewChannel] = useState('');
  const [taskFilter, setTaskFilter] = useState('all');
  const defaultPromoText = useMemo(() => `🎉 **VIP Earning Opportunity!** 🎉

Join our exclusive network of Telegram channels to start earning real money today! Complete simple tasks and get paid directly to your UPI.

**Your Tasks:**
${channels.map(channel => `- Join ${channel.split('/').pop()}`).join('\n')}

**How it works:**
1. Click and join all the channels from our app.
2. Submit your Name and UPI ID.
3. Get rewarded!

💰 Earn up to ₹${rechargeAmounts.length > 0 ? Math.max(...rechargeAmounts) : 50} daily!

➡️ Get started now: [Your App Link Here]`, [channels, rechargeAmounts]);
  const [baseText, setBaseText] = useState(defaultPromoText);
  const [stylePrompt, setStylePrompt] = useState('Make this message look highly professional, urgent, and exclusive for a VIP audience. Use emojis effectively.');
  const [generatedMessage, setGeneratedMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const handleGenerateMessage = async () => {
    setIsLoading(true);
    setError('');
    setGeneratedMessage('');
    try {
      const result = await generateStyledMessage(baseText, stylePrompt);
      setGeneratedMessage(result);
    } catch (e) {
      setError(e.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };
  const handleCopyToClipboard = () => {
    if (generatedMessage) {
      navigator.clipboard.writeText(generatedMessage);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };
  const handleAddChannelSubmit = e => {
    e.preventDefault();
    onAddChannel(newChannel);
    setNewChannel('');
  };
  const pendingCount = useMemo(() => submissions.filter(s => s.status === 'pending').length, [submissions]);
  const stats = useMemo(() => {
    // Fix: Cast the result of Object.values to number[] to ensure correct type for reduce operation,
    // resolving arithmetic errors caused by 'unknown' type from JSON.parse.
    const totalClicks = Object.values(channelClicks).reduce((sum, count) => sum + count, 0);
    const approvedTotal = submissions.reduce((acc, sub) => sub.status === 'approved' ? acc + sub.selectedAmount : acc, 0);
    const pendingTotal = submissions.reduce((acc, sub) => sub.status === 'pending' ? acc + sub.selectedAmount : acc, 0);
    const conversionRate = totalClicks > 0 ? (submissions.length / totalClicks * 100).toFixed(1) : '0.0';
    return {
      totalClicks,
      approvedTotal,
      pendingTotal,
      conversionRate
    };
  }, [submissions, channelClicks]);
  const filteredSubmissions = useMemo(() => {
    const sorted = [...submissions].sort((a, b) => b.timestamp - a.timestamp);
    if (taskFilter === 'all') return sorted;
    return sorted.filter(s => s.status === taskFilter);
  }, [submissions, taskFilter]);
  return /*#__PURE__*/React.createElement("div", {
    className: "p-4 md:p-6 lg:p-8"
  }, /*#__PURE__*/React.createElement("div", {
    className: "max-w-4xl mx-auto flex flex-col gap-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "border-b border-cyan-900/50 flex space-x-1 overflow-x-auto"
  }, /*#__PURE__*/React.createElement(AdminTab, {
    active: activeTab === 'tasks',
    onClick: () => setActiveTab('tasks'),
    count: pendingCount
  }, "Dashboard"), /*#__PURE__*/React.createElement(AdminTab, {
    active: activeTab === 'channels',
    onClick: () => setActiveTab('channels')
  }, "Channels"), /*#__PURE__*/React.createElement(AdminTab, {
    active: activeTab === 'promote',
    onClick: () => setActiveTab('promote')
  }, "Promote"), /*#__PURE__*/React.createElement(AdminTab, {
    active: activeTab === 'analytics',
    onClick: () => setActiveTab('analytics')
  }, "Analytics"), /*#__PURE__*/React.createElement(AdminTab, {
    active: activeTab === 'download',
    onClick: () => setActiveTab('download')
  }, "Download")), /*#__PURE__*/React.createElement("div", {
    className: "min-h-[400px]"
  }, activeTab === 'tasks' && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    className: "text-xl font-bold text-white mb-4 border-l-4 border-cyan-500 pl-3"
  }, "Payment Overview"), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6"
  }, /*#__PURE__*/React.createElement(StatCard, {
    title: "Total Submissions",
    value: submissions.length,
    customClasses: "bg-black/20 border-cyan-800"
  }), /*#__PURE__*/React.createElement(StatCard, {
    title: "Total Paid",
    value: `₹${stats.approvedTotal}`,
    customClasses: "bg-green-500/10 border-green-500/50"
  }), /*#__PURE__*/React.createElement(StatCard, {
    title: "Total Pending",
    value: `₹${stats.pendingTotal}`,
    customClasses: "bg-yellow-500/10 border-yellow-500/50"
  })), /*#__PURE__*/React.createElement("h2", {
    className: "text-xl font-bold text-white mb-4 border-l-4 border-cyan-500 pl-3"
  }, "Withdrawal History (", filteredSubmissions.length, ")"), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 mb-4"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-sm text-cyan-200"
  }, "Filter by status:"), ['all', 'pending', 'approved', 'rejected'].map(status => /*#__PURE__*/React.createElement("button", {
    key: status,
    onClick: () => setTaskFilter(status),
    className: `px-3 py-1 text-xs font-semibold rounded-full capitalize transition-colors ${taskFilter === status ? 'bg-cyan-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`
  }, status))), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col gap-3"
  }, filteredSubmissions.length > 0 ? filteredSubmissions.map(sub => /*#__PURE__*/React.createElement("div", {
    key: sub.id,
    className: "bg-black/20 rounded-lg border border-cyan-900/50 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex-1 space-y-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("p", {
    className: "font-bold text-white"
  }, sub.userName), /*#__PURE__*/React.createElement("p", {
    className: "font-mono text-cyan-300 text-lg font-semibold"
  }, `₹${sub.selectedAmount}`)), /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-gray-400 font-mono break-all"
  }, sub.upiId), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between text-xs text-gray-500 pt-1"
  }, /*#__PURE__*/React.createElement("span", null, new Date(sub.timestamp).toLocaleString()), /*#__PURE__*/React.createElement(StatusBadge, {
    status: sub.status
  }))), sub.status === 'pending' && /*#__PURE__*/React.createElement("div", {
    className: "flex-shrink-0 flex sm:flex-col items-center gap-2"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => onUpdateStatus(sub.id, 'approved'),
    className: "w-full sm:w-auto flex items-center justify-center gap-2 px-3 py-1.5 bg-green-600 text-white text-sm rounded-md font-medium hover:bg-green-700 transition-colors"
  }, /*#__PURE__*/React.createElement(CheckCircleIcon, {
    className: "w-4 h-4"
  }), " Approve"), /*#__PURE__*/React.createElement("button", {
    onClick: () => onUpdateStatus(sub.id, 'rejected'),
    className: "w-full sm:w-auto flex items-center justify-center gap-2 px-3 py-1.5 bg-red-600 text-white text-sm rounded-md font-medium hover:bg-red-700 transition-colors"
  }, /*#__PURE__*/React.createElement(XCircleIcon, {
    className: "w-4 h-4"
  }), " Reject")))) : /*#__PURE__*/React.createElement("p", {
    className: "text-gray-500 text-center py-8"
  }, "No submissions found for this filter."))), activeTab === 'channels' && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    className: "text-xl font-bold text-white mb-4 border-l-4 border-cyan-500 pl-3"
  }, "Manage Channels (", channels.length, ")"), /*#__PURE__*/React.createElement("div", {
    className: "mb-6"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "text-lg font-semibold text-white mb-2"
  }, "Add New Channel"), /*#__PURE__*/React.createElement("form", {
    onSubmit: handleAddChannelSubmit,
    className: "flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("input", {
    type: "url",
    value: newChannel,
    onChange: e => setNewChannel(e.target.value),
    placeholder: "https://t.me/your_channel_link",
    className: "flex-grow p-2 bg-cyan-900/50 border-2 border-cyan-700 rounded-md text-gray-200 placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500",
    "aria-label": "New Telegram channel URL"
  }), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    className: "flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md font-medium hover:bg-green-700 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed",
    disabled: !newChannel.trim(),
    "aria-label": "Add channel"
  }, /*#__PURE__*/React.createElement(PlusIcon, {
    className: "w-5 h-5"
  }), /*#__PURE__*/React.createElement("span", null, "Add")))), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col gap-2"
  }, channels.length > 0 ? channels.map((channel, index) => /*#__PURE__*/React.createElement("div", {
    key: index,
    className: "flex items-center justify-between p-3 bg-black/20 rounded-lg border border-cyan-900/50 hover:bg-black/30 transition-colors"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-4 flex-wrap"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-gray-300 font-mono text-sm break-all"
  }, channel), /*#__PURE__*/React.createElement("span", {
    className: "flex items-center gap-1.5 text-xs text-cyan-300 bg-cyan-900/60 px-2 py-1 rounded-full border border-cyan-800"
  }, /*#__PURE__*/React.createElement(CursorClickIcon, {
    className: "w-3.5 h-3.5"
  }), /*#__PURE__*/React.createElement("span", null, channelClicks[channel] || 0, " Clicks"))), /*#__PURE__*/React.createElement("button", {
    onClick: () => onRemoveChannel(channel),
    className: "p-1 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-full transition-colors",
    "aria-label": `Remove ${channel}`
  }, /*#__PURE__*/React.createElement(TrashIcon, {
    className: "w-5 h-5"
  })))) : /*#__PURE__*/React.createElement("p", {
    className: "text-gray-500 text-center py-4"
  }, "No channels listed. Add one above to get started."))), activeTab === 'promote' && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    className: "text-xl font-bold text-white mb-4 border-l-4 border-cyan-500 pl-3 flex items-center gap-2"
  }, /*#__PURE__*/React.createElement(ShareIcon, {
    className: "w-6 h-6"
  }), "AI Promotion Assistant"), /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-cyan-200 mb-6"
  }, "Generate a professionally styled promotional message for your Telegram channels using AI. Edit the base text and provide a styling prompt, then let Gemini do the magic."), /*#__PURE__*/React.createElement("div", {
    className: "space-y-6"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    htmlFor: "baseText",
    className: "block text-lg font-semibold text-white mb-2"
  }, "Base Message Content"), /*#__PURE__*/React.createElement("textarea", {
    id: "baseText",
    rows: 10,
    value: baseText,
    onChange: e => setBaseText(e.target.value),
    className: "w-full p-3 bg-cyan-900/50 border-2 border-cyan-700 rounded-md text-gray-200 placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500",
    placeholder: "Enter the core text of your promotion..."
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    htmlFor: "stylePrompt",
    className: "block text-lg font-semibold text-white mb-2"
  }, "Styling Prompt"), /*#__PURE__*/React.createElement("textarea", {
    id: "stylePrompt",
    rows: 3,
    value: stylePrompt,
    onChange: e => setStylePrompt(e.target.value),
    className: "w-full p-3 bg-cyan-900/50 border-2 border-cyan-700 rounded-md text-gray-200 placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500",
    placeholder: "e.g., 'Make it exciting with lots of emojis!'"
  })), /*#__PURE__*/React.createElement("button", {
    onClick: handleGenerateMessage,
    disabled: isLoading || !baseText || !stylePrompt,
    className: "w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-orange-500 text-white rounded-md text-lg font-bold transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/40 hover:scale-[1.02] disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed disabled:scale-100 disabled:shadow-none"
  }, isLoading ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(ArrowPathIcon, {
    className: "w-6 h-6 animate-spin"
  }), /*#__PURE__*/React.createElement("span", null, "Generating...")) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(SparklesIcon, {
    className: "w-6 h-6"
  }), /*#__PURE__*/React.createElement("span", null, "Generate Styled Message"))), error && /*#__PURE__*/React.createElement("p", {
    className: "text-red-400 bg-red-500/20 p-3 rounded-md text-center"
  }, error), generatedMessage && /*#__PURE__*/React.createElement("div", {
    className: "space-y-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between items-center"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "text-lg font-semibold text-white"
  }, "Generated Result"), /*#__PURE__*/React.createElement("button", {
    onClick: handleCopyToClipboard,
    className: "flex items-center gap-2 px-3 py-1.5 bg-gray-700 text-white text-sm rounded-md font-medium hover:bg-gray-600 transition-colors"
  }, isCopied ? /*#__PURE__*/React.createElement(CheckCircleIcon, {
    className: "w-4 h-4 text-green-400"
  }) : /*#__PURE__*/React.createElement(ClipboardIcon, {
    className: "w-4 h-4"
  }), isCopied ? 'Copied!' : 'Copy')), /*#__PURE__*/React.createElement("pre", {
    className: "w-full p-4 bg-black/30 border border-cyan-800 rounded-md text-gray-200 whitespace-pre-wrap font-sans text-sm"
  }, generatedMessage)))), activeTab === 'analytics' && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    className: "text-xl font-bold text-white mb-4 border-l-4 border-cyan-500 pl-3 flex items-center gap-2"
  }, /*#__PURE__*/React.createElement(ChartBarIcon, {
    className: "w-6 h-6"
  }), "Channel Analytics"), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6"
  }, /*#__PURE__*/React.createElement(StatCard, {
    title: "Total Clicks",
    value: stats.totalClicks,
    customClasses: "bg-black/20 border-cyan-800"
  }), /*#__PURE__*/React.createElement(StatCard, {
    title: "Total Submissions",
    value: submissions.length,
    customClasses: "bg-black/20 border-purple-800"
  }), /*#__PURE__*/React.createElement(StatCard, {
    title: "Conversion Rate",
    value: `${stats.conversionRate}%`,
    customClasses: "bg-green-500/10 border-green-500/50"
  })), /*#__PURE__*/React.createElement("h3", {
    className: "text-lg font-semibold text-white mb-4 border-l-4 border-cyan-500 pl-3"
  }, "Channel Performance"), /*#__PURE__*/React.createElement("div", {
    className: "bg-black/20 rounded-lg border border-cyan-900/50 p-4"
  }, /*#__PURE__*/React.createElement(ChannelPerformanceChart, {
    channelClicks: channelClicks
  }))), activeTab === 'download' && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    className: "text-xl font-bold text-white mb-4 border-l-4 border-cyan-500 pl-3"
  }, "Download Application"), /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-cyan-200 mb-4"
  }, "Click the button below to download a deployable ZIP file of the user-facing application. The ZIP will be configured with the current list of channels you've set up. Task submission data is stored in your browser's local storage and will not be included in the ZIP."), /*#__PURE__*/React.createElement("button", {
    onClick: onDownloadZip,
    className: "w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-red-600 to-orange-500 text-white rounded-md text-lg font-bold transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/40 hover:scale-[1.02]"
  }, /*#__PURE__*/React.createElement(ArrowDownTrayIcon, {
    className: "w-6 h-6"
  }), /*#__PURE__*/React.createElement("span", null, "Download Deployable ZIP"))))));
};