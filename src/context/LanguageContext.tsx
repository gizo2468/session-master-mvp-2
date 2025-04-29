import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

// Define supported languages
export type Language = 'en' | 'he';

// Define translations interface
interface Translations {
  [key: string]: {
    [key: string]: string;
  };
}

// Basic translations
const translations: Translations = {
  en: {
    // General
    "app_name": "Session Master",
    "save": "Save",
    "cancel": "Cancel",
    "confirm": "Confirm",
    "delete": "Delete",
    "back": "Back",
    "loading": "Loading...",
    "success": "Success",
    "error": "Error",
    
    // Auth
    "login": "Log In",
    "signup": "Sign Up",
    "logout": "Log Out",
    "email": "Email",
    "password": "Password",
    "confirm_password": "Confirm Password",
    "full_name": "Full Name",
    "welcome_back": "Welcome Back",
    "sign_in_prompt": "Sign in to access your account",
    "create_account": "Create Account",
    "sign_up_prompt": "Sign up to start using Session Master",
    "already_have_account": "Already have an account?",
    "dont_have_account": "Don't have an account?",
    
    // Settings
    "settings": "Settings",
    "account_settings": "Account Settings",
    "coach_settings": "Coach Settings",
    "student_settings": "Student Settings",
    "app_settings": "App Settings",
    "billing": "Billing & Subscription",
    "help": "Support & Help",
    "profile_picture": "Profile Picture",
    "upload_picture": "Upload Picture",
    "change_password": "Change Password",
    "current_password": "Current Password",
    "new_password": "New Password",
    "reset_password": "Reset Password",
    "send_reset_link": "Send Reset Link",
    "sending": "Sending...",
    "language": "Language",
    "notifications": "Notifications",
    "session_notifications": "Live Session Notifications",
    "feedback_notifications": "New Feedback Notifications",
    "connection_code": "Connection Code",
    "generate_code": "Generate New Code",
    "copy_code": "Copy Code",
    "disable_code": "Disable Code",
    "manage_students": "Manage Students",
    "upgrade_plan": "Upgrade Plan",
    "connected_coaches": "Connected Coaches",
    "disconnect": "Disconnect",
    "upgrade_to_coach": "Upgrade to Coach Account",
    "current_plan": "Current Plan",
    "student_slots": "Student Slots",
    "next_billing": "Next Billing Date",
    "per_month": "per month",
    "available_plans": "Available Plans",
    "upgrade": "Upgrade",
    "click_to_change_plan": "Click to change plan",
    "support_request": "Submit Support Request",
    "terms_of_service": "Terms of Service",
    "privacy_policy": "Privacy Policy",
    
    // Error Messages
    "error_required_field": "This field is required",
    "error_invalid_email": "Please enter a valid email address",
    "error_password_length": "Password must be at least 6 characters long",
    "error_passwords_dont_match": "Passwords don't match",
  },
  he: {
    // General
    "app_name": "מנהל סשנים",
    "save": "שמור",
    "cancel": "בטל",
    "confirm": "אשר",
    "delete": "מחק",
    "back": "חזור",
    "loading": "טוען...",
    "success": "הצלחה",
    "error": "שגיאה",
    
    // Auth
    "login": "התחבר",
    "signup": "הירשם",
    "logout": "התנתק",
    "email": "אימייל",
    "password": "סיסמה",
    "confirm_password": "אימות סיסמה",
    "full_name": "שם מלא",
    "welcome_back": "ברוך שובך",
    "sign_in_prompt": "התחבר כדי לגשת לחשבון שלך",
    "create_account": "צור חשבון",
    "sign_up_prompt": "הירשם כדי להתחיל להשתמש במנהל סשנים",
    "already_have_account": "כבר יש לך חשבון?",
    "dont_have_account": "אין לך חשבון?",
    
    // Settings
    "settings": "הגדרות",
    "account_settings": "הגדרות חשבון",
    "coach_settings": "הגדרות מאמן",
    "student_settings": "הגדרות תלמיד",
    "app_settings": "הגדרות אפליקציה",
    "billing": "חיוב ומנוי",
    "help": "תמיכה ועזרה",
    "profile_picture": "תמונת פרופיל",
    "upload_picture": "העלה תמונה",
    "change_password": "שנה סיסמה",
    "current_password": "סיסמה נוכחית",
    "new_password": "סיסמה חדשה",
    "reset_password": "אפס סיסמה",
    "send_reset_link": "שלח קישור לאיפוס",
    "sending": "שולח...",
    "language": "שפה",
    "notifications": "התראות",
    "session_notifications": "התראות סשנים בשידור חי",
    "feedback_notifications": "התראות משוב חדש",
    "connection_code": "קוד חיבור",
    "generate_code": "צור קוד חדש",
    "copy_code": "העתק קוד",
    "disable_code": "בטל קוד",
    "manage_students": "נהל תלמידים",
    "upgrade_plan": "שדרג תכנית",
    "connected_coaches": "מאמנים מחוברים",
    "disconnect": "נתק",
    "upgrade_to_coach": "שדרג לחשבון מאמן",
    "current_plan": "תכנית נוכחית",
    "student_slots": "מקומות תלמידים",
    "next_billing": "תאריך החיוב הבא",
    "per_month": "לחודש",
    "available_plans": "תכניות זמינות",
    "upgrade": "שדרג",
    "click_to_change_plan": "לחץ לשינוי תכנית",
    "support_request": "שלח בקשת תמיכה",
    "terms_of_service": "תנאי שימוש",
    "privacy_policy": "מדיניות פרטיות",
    
    // Error Messages
    "error_required_field": "שדה זה הוא חובה",
    "error_invalid_email": "אנא הזן כתובת אימייל תקינה",
    "error_password_length": "הסיסמה חייבת להיות באורך של 6 תווים לפחות",
    "error_passwords_dont_match": "הסיסמאות אינן תואמות",
  }
};

// Utility function to get a translation
export const getTranslation = (key: string, language: Language): string => {
  return translations[language]?.[key] || key;
};

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string; // Translation function
  dir: string; // Text direction
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, updateUser } = useAuth();
  const [language, setStateLanguage] = useState<Language>(user?.language || 'en');

  // Update language when user changes
  useEffect(() => {
    if (user?.language) {
      setStateLanguage(user.language);
    }
  }, [user?.language]);

  // Set document direction based on language
  useEffect(() => {
    document.documentElement.dir = language === 'he' ? 'rtl' : 'ltr';
  }, [language]);

  // Set language and update user preferences if logged in
  const setLanguage = (lang: Language) => {
    setStateLanguage(lang);
    if (user) {
      updateUser({ language: lang });
    }
  };

  // Translation function
  const t = (key: string) => getTranslation(key, language);

  const value = {
    language,
    setLanguage,
    t,
    dir: language === 'he' ? 'rtl' : 'ltr'
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
