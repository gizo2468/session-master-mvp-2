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

// Comprehensive translations for the entire app
const translations: Translations = {
  en: {
    // General UI
    "app_name": "Session Master",
    "save": "Save",
    "cancel": "Cancel",
    "confirm": "Confirm",
    "delete": "Delete",
    "edit": "Edit",
    "back": "Back",
    "loading": "Loading...",
    "success": "Success",
    "error": "Error",
    "yes": "Yes",
    "no": "No",
    "add": "Add",
    "remove": "Remove",
    "search": "Search",
    "filter": "Filter",
    "sort": "Sort",
    "view": "View",
    "view_all": "View All",
    "more": "More",
    "less": "Less",
    "copy": "Copy",
    "copied": "Copied",
    "share": "Share",
    "submit": "Submit",
    "active": "ACTIVE",
    "minutes": "minutes",
    "hands": "Hands",

    // Navigation
    "home": "Home",
    "dashboard": "Dashboard",
    "profile": "Profile",
    "settings": "Settings",
    "sessions": "Sessions",
    "tables": "Tables",
    "stats": "Stats",
    "history": "History",
    "session_history": "Session History",
    
    // Auth
    "login": "Log In",
    "signup": "Sign Up",
    "logout": "Log Out",
    "email": "Email",
    "password": "Password",
    "confirm_password": "Confirm Password",
    "full_name": "Full Name",
    "online_nickname": "Online Nickname",
    "welcome_back": "Welcome Back",
    "sign_in_prompt": "Sign in to access your account",
    "create_account": "Create Account",
    "sign_up_prompt": "Sign up to start using Session Master",
    "already_have_account": "Already have an account?",
    "dont_have_account": "Don't have an account?",
    
    // Settings
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
    "support_request": "Submit Support Request",
    "legal_information": "Legal Information",
    "review_terms_policies": "Review our terms and policies",
    "terms_of_service": "Terms of Service",
    "privacy_policy": "Privacy Policy",
    
    // Session Tracking
    "new_session": "New Session",
    "live_session": "Live Session",
    "end_session": "End Session",
    "session_stats": "Session Stats",
    "recent_sessions": "Recent Sessions",
    "active_sessions": "Active Sessions",
    "tournament": "Tournament",
    "cash_game": "Cash Game",
    "net_profit": "Net Profit",
    "record": "Record",
    "buy_in": "Buy-in",
    "cash_out": "Cash out",
    "rebuy": "Rebuy",
    "re_buys": "Re-Buys",
    "blinds": "Blinds",
    "format": "Format",
    "game": "Game",
    "started": "Started",
    "ended": "Ended",
    "duration": "Duration",
    "profit_loss": "Profit/Loss",
    "add_rebuy": "Add Rebuy",
    "add_hand": "Add Hand",
    "notes": "Notes",
    "session_notes": "Session Notes",
    "tables_played": "Tables Played",
    "players_eliminated": "Players Eliminated",
    "total_bounty_collected": "Total Bounty Collected",
    "total_cash_out": "Total Cash Out",
    "tournament_type": "Tournament Type",
    "starting_bbs": "Starting BBs",
    "start": "Start",
    "end": "End",
    "no_sessions_yet": "No sessions yet. Start tracking your first poker session!",
    "no_sessions_found": "No sessions found. Adjust your filters or start a new session.",
    "delete_session_warning": "This action cannot be undone. This will permanently delete the session and all related data.",
    "confirm_delete": "Confirm Delete",
    "session_not_found": "Session not found",
    "back_to_home": "Back to Home",
    "session_deleted": "Session Deleted",
    "session_deleted_desc": "The session has been permanently deleted.",
    "notes_updated": "Notes Updated",
    "edit_session_notes": "Edit Session Notes",
    "session_notes_placeholder": "Add notes about your session here...",
    "no_notes": "No notes added yet.",
    "add_notes": "Add Notes",
    "cash_games_amount": "Cash Games Amount",
    "tournaments_amount": "Tournaments Amount",
    
    // Coach-Student System
    "coach_profile": "Coach Profile",
    "student_profile": "Student Profile",
    "coach_dashboard": "Coach Dashboard",
    "manage_your_students": "Manage your students and connection codes",
    "student_capacity": "Student Capacity",
    "live_sessions": "Live Sessions",
    "recent_feedback": "Recent Feedback",
    "feedback_archive": "Feedback Archive",
    "session_review": "Session Review",
    "add_comment": "Add Comment",
    "add_session_comment": "Add Session Comment",
    "become_coach": "Become a Coach",
    "share_code_with_students": "Share this code with your students to connect with them",
    "students": "Students",
    "connect_with_coach": "Connect with a Coach",
    "no_connected_coaches": "No connected coaches",
    "view_feedback": "View Feedback",
    "coach_tier_upgrade": "Coach Tier Upgrade",
    "current_coach_plan": "Current Plan",
    "student_management": "Student Management",
    
    // Focus Mode
    "focus_mode": "Focus Mode",
    "enter_focus_mode": "Enter Focus Mode",
    "exit_focus_mode": "Exit Focus Mode",
    "poker_tips": "Poker Tips",
    "focus_mode_description": "Select how long you want to stay in focus mode.",
    "focus_mode_warning": "Your phone will be locked in focus mode for the selected duration to help you concentrate on your game.",
    
    // Error Messages
    "error_required_field": "This field is required",
    "error_invalid_email": "Please enter a valid email address",
    "error_password_length": "Password must be at least 6 characters long",
    "error_passwords_dont_match": "Passwords don't match",
    "storage_issue": "Storage Issue",
    "profile_update_no_persist": "Profile updated, but changes may not persist after logout.",
    
    // Added translations for StudentSettings
    "disconnect_confirmation": "Are you sure you want to disconnect from this coach? This will remove your connection with them.",
    "upgrade_to_coach_description": "Upgrade your account to become a coach and start helping other players improve their game",
    "coaching": "Coaching",
    "player_dashboard": "Player Dashboard",
    "session_ended": "Session Ended",
    "session_ended_success": "Your poker session has been successfully recorded.",
    "rebuy_added": "Rebuy Added",
    "rebuy_added_description": "rebuy has been added to your session.",
    "no_active_session": "No active session",
    "no_active_session_description": "There is no active poker session at the moment.",
    "return_to_home": "Return to Home",
    "enter_cash_out_amount": "Enter your cash out amount to complete your session.",
    "confirm_exit_focus_mode": "Are you sure you want to exit Focus Mode?",
    "strategic_tips": "Strategic Tips",
    "focus_mode_description_active": "Stay focused on your game and avoid distractions",
    "emergency_unlock": "Emergency Unlock",
    "all_games": "All Games",
    "all_formats": "All Formats",
    "location": "Location",
  },
  
  he: {
    // General UI
    "app_name": "מנהל סשנים",
    "save": "שמור",
    "cancel": "בטל",
    "confirm": "אשר",
    "delete": "מחק",
    "edit": "ערוך",
    "back": "חזור",
    "loading": "טוען...",
    "success": "הצלחה",
    "error": "שגיאה",
    "yes": "כן",
    "no": "לא",
    "add": "הוסף",
    "remove": "הסר",
    "search": "חפש",
    "filter": "סנן",
    "sort": "מיין",
    "view": "צפה",
    "view_all": "צפה בהכל",
    "more": "עוד",
    "less": "פחות",
    "copy": "העתק",
    "copied": "הועתק",
    "share": "שתף",
    "submit": "שלח",
    "active": "פעיל",
    "minutes": "דקות",
    "hands": "ידיים",

    // Navigation
    "home": "בית",
    "dashboard": "לוח בקרה",
    "profile": "פרופיל",
    "settings": "הגדרות",
    "sessions": "סשנים",
    "tables": "שולחנות",
    "stats": "סטטיסטיקות",
    "history": "היסטוריה",
    "session_history": "היסטורית סשנים",
    
    // Auth
    "login": "התחבר",
    "signup": "הירשם",
    "logout": "התנתק",
    "email": "אימייל",
    "password": "סיסמה",
    "confirm_password": "אימות סיסמה",
    "full_name": "שם מלא",
    "online_nickname": "כינוי מקוון",
    "welcome_back": "ברוך שובך",
    "sign_in_prompt": "התחבר כדי לגשת לחשבון שלך",
    "create_account": "צור חשבון",
    "sign_up_prompt": "הירשם כדי להתחיל להשתמש במנהל סשנים",
    "already_have_account": "כבר יש לך חשבון?",
    "dont_have_account": "אין לך חשבון?",
    
    // Settings
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
    "support_request": "שלח בקשת תמיכה",
    "legal_information": "מידע משפטי",
    "review_terms_policies": "עיין בתנאים ובמדיניות שלנו",
    "terms_of_service": "תנאי שימוש",
    "privacy_policy": "מדיניות פרטיות",
    
    // Session Tracking
    "new_session": "סשן חדש",
    "live_session": "סשן חי",
    "end_session": "סיים סשן",
    "session_stats": "נתוני סשן",
    "recent_sessions": "סשנים אחרונים",
    "active_sessions": "סשנים פעילים",
    "tournament": "טורניר",
    "cash_game": "משחק קופה",
    "net_profit": "רווח נקי",
    "record": "רקורד",
    "buy_in": "קניה",
    "cash_out": "פדיון",
    "rebuy": "קנייה מחדש",
    "re_buys": "קניות מחדש",
    "blinds": "בליינדים",
    "format": "פורמט",
    "game": "משחק",
    "started": "התחיל",
    "ended": "הסתיים",
    "duration": "משך זמן",
    "profit_loss": "רווח/הפסד",
    "add_rebuy": "הוסף קנייה מחדש",
    "add_hand": "הוסף יד",
    "notes": "הערות",
    "session_notes": "הערות סשן",
    "tables_played": "שולחנות ששוחקו",
    "players_eliminated": "שחקנים שהודחו",
    "total_bounty_collected": "סך באונטי שנאסף",
    "total_cash_out": "סך פדיון",
    "tournament_type": "סוג טורניר",
    "starting_bbs": "בליינדים התחלתיים",
    "start": "התחלה",
    "end": "סיום",
    "no_sessions_yet": "אין סשנים עדיין. התחל לעקוב אחר סשן הפוקר הראשון שלך!",
    "no_sessions_found": "לא נמצאו סשנים. התאם את הסינון או התחל סשן חדש.",
    "delete_session_warning": "פעולה זו אינה ניתנת לביטול. פעולה זו תמחק לצמיתות את הסשן ואת כל הנתונים הקשורים אליו.",
    "confirm_delete": "אישור מחיקה",
    "session_not_found": "הסשן לא נמצא",
    "back_to_home": "חזרה לדף הבית",
    "session_deleted": "הסשן נמחק",
    "session_deleted_desc": "הסשן נמחק לצמיתות.",
    "notes_updated": "הערות עודכנו",
    "edit_session_notes": "ערוך הערות סשן",
    "session_notes_placeholder": "הוסף הערות על הסשן כאן...",
    "no_notes": "טרם נוספו הערות.",
    "add_notes": "הוסף הערות",
    "cash_games_amount": "כמות משחקי קופה",
    "tournaments_amount": "כמות טורנירים",
    
    // Coach-Student System
    "coach_profile": "פרופיל מאמן",
    "student_profile": "פרופיל תלמיד",
    "coach_dashboard": "לוח בקרה למאמן",
    "manage_your_students": "נהל את התלמידים שלך וקודי חיבור",
    "student_capacity": "קיבולת תלמידים",
    "live_sessions": "סשנים חיים",
    "recent_feedback": "משוב אחרון",
    "feedback_archive": "ארכיון משוב",
    "session_review": "סקירת סשן",
    "add_comment": "הוסף תגובה",
    "add_session_comment": "הוסף תגובה לסשן",
    "become_coach": "הפוך למאמן",
    "share_code_with_students": "שתף קוד זה עם התלמידים שלך כדי להתחבר איתם",
    "students": "תלמידים",
    "connect_with_coach": "התחבר עם מאמן",
    "no_connected_coaches": "אין מאמנים מחוברים",
    "view_feedback": "צפה במשוב",
    "coach_tier_upgrade": "שדרוג רמת מאמן",
    "current_coach_plan": "תכנית נוכחית",
    "student_management": "ניהול תלמידים",
    
    // Focus Mode
    "focus_mode": "מצב ריכוז",
    "enter_focus_mode": "כנס למצב ריכוז",
    "exit_focus_mode": "צא ממצב ריכוז",
    "poker_tips": "טיפים לפוקר",
    "focus_mode_description": "בחר למשך כמה זמן ברצונך להישאר במצב ריכוז.",
    "focus_mode_warning": "הטלפון שלך יהיה נעול במצב ריכוז למשך הזמן שבחרת כדי לעזור לך להתרכז במשחק.",
    
    // Error Messages
    "error_required_field": "שדה זה הוא חובה",
    "error_invalid_email": "אנא הזן כתובת אימייל תקינה",
    "error_password_length": "הסיסמה חייבת להיות באורך של 6 תווים לפחות",
    "error_passwords_dont_match": "הסיסמאות אינן תואמות",
    "storage_issue": "בעיית אחסון",
    "profile_update_no_persist": "הפרופיל עודכן, אך השינויים עשויים לא להישמר אחרי התנתקות.",
    
    // Added translations for StudentSettings
    "disconnect_confirmation": "האם אתה בטוח שברצונך להתנתק ממאמן זה? פעולה זו תסיר את החיבור ביניכם.",
    "upgrade_to_coach_description": "שדרג את החשבון שלך כדי להפוך למאמן ולהתחיל לעזור לשחקנים אחרים לשפר את המשחק שלהם",
    "coaching": "אימון",
    "player_dashboard": "לוח בקרת שחקן",
    "session_ended": "הסשן הסתיים",
    "session_ended_success": "סשן הפוקר שלך נרשם בהצלחה.",
    "rebuy_added": "ריבאי נוסף",
    "rebuy_added_description": "ריבאי נוסף לסשן שלך.",
    "no_active_session": "אין סשן פעיל",
    "no_active_session_description": "אין כרגע סשן פוקר פעיל.",
    "return_to_home": "חזור לדף הבית",
    "enter_cash_out_amount": "הזן את סכום הפדיון שלך כדי להשלים את הסשן.",
    "confirm_exit_focus_mode": "האם אתה בטוח שברצונך לצאת ממצב הריכוז?",
    "strategic_tips": "טיפים אסטרטגיים",
    "focus_mode_description_active": "התרכז במשחק שלך והימנע מהסחות דעת",
    "emergency_unlock": "שחרור חירום",
    "all_games": "כל המשחקים",
    "all_formats": "כל הפורמטים",
    "location": "מיקום",
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
    
    // Also set a data attribute on the html element for additional styling hooks
    document.documentElement.setAttribute('data-language', language);
    
    // Apply RTL-specific styles at the document level when needed
    if (language === 'he') {
      document.body.classList.add('rtl-language');
    } else {
      document.body.classList.remove('rtl-language');
    }
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
