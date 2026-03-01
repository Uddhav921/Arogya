"use client";

import { createContext, useContext, useState, useEffect } from "react";

const LanguageContext = createContext();

const DICTIONARIES = {
  English: {
    dashboard: "Dashboard",
    symptomCheck: "Symptom Check",
    chat: "Arogya AI Chat",
    records: "Records",
    profile: "My Profile",
    coreActions: "Core Actions",
    signOut: "Sign out",
    lightMode: "Light Mode",
    darkMode: "Dark Mode",
    upgradeProvider: "Upgrade to Pro",
    accountSettings: "Account Settings",
    freePlan: "Free Plan",
    greeting: "Welcome back",
    // Add more translations as needed
  },
  Hindi: {
    dashboard: "डैशबोर्ड",
    symptomCheck: "लक्षण जांच",
    chat: "आरोग्य AI चैट",
    records: "रिकॉर्ड",
    profile: "मेरी प्रोफ़ाइल",
    coreActions: "मुख्य क्रियाएं",
    signOut: "साइन आउट",
    lightMode: "लाइट मोड",
    darkMode: "डार्क मोड",
    upgradeProvider: "प्रो में अपग्रेड करें",
    accountSettings: "खाता सेटिंग्स",
    freePlan: "फ्री प्लान",
    greeting: "वापसी पर स्वागत है",
  },
  Marathi: {
    dashboard: "डॅशबोर्ड",
    symptomCheck: "लक्षणे तपासा",
    chat: "आरोग्य AI चॅट",
    records: "नोंदी",
    profile: "माझे प्रोफाइल",
    coreActions: "मुख्य क्रिया",
    signOut: "साइन आउट",
    lightMode: "लाइट मोड",
    darkMode: "डार्क मोड",
    upgradeProvider: "प्रो वर अपग्रेड करा",
    accountSettings: "खाते सेटिंग्ज",
    freePlan: "फ्री प्लॅन",
    greeting: "पुन्हा स्वागत आहे",
  }
};

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState("English");
  
  useEffect(() => {
    const savedLang = localStorage.getItem("arogya-language");
    if (savedLang && DICTIONARIES[savedLang]) {
      setLanguage(savedLang);
    }
  }, []);

  const changeLanguage = (lang) => {
    if (DICTIONARIES[lang]) {
      setLanguage(lang);
      localStorage.setItem("arogya-language", lang);
    }
  };

  const t = (key) => {
    return DICTIONARIES[language]?.[key] || DICTIONARIES["English"]?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
