import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../hooks/useAuth";
import "./ProfileModal.css";

export default function ProfileModal({ onClose }) {
  const { t } = useTranslation();
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    surname: "",
    birthday: "",
    targetPosition: "",
    cvFile: null,
    // CV Form Fields
    phone: "",
    address: "",
    city: "",
    country: "",
    postalCode: "",
    linkedin: "",
    github: "",
    portfolio: "",
    summary: "",
    experience: [{
      company: "",
      position: "",
      startDate: "",
      endDate: "",
      description: ""
    }],
    education: [{
      institution: "",
      degree: "",
      field: "",
      startDate: "",
      endDate: "",
      gpa: ""
    }],
    skills: "",
    languages: "",
    certifications: "",
    references: ""
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cvUploadLoading, setCvUploadLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email || "",
        password: "",
        name: user.name || "",
        surname: user.surname || "",
        birthday: user.birthday ? new Date(user.birthday).toISOString().split('T')[0] : "",
        targetPosition: user.targetPosition || "",
        cvFile: null,
        // CV Form Fields
        phone: user.phone || "",
        address: user.address || "",
        city: user.city || "",
        country: user.country || "",
        postalCode: user.postalCode || "",
        linkedin: user.linkedin || "",
        github: user.github || "",
        portfolio: user.portfolio || "",
        summary: user.summary || "",
        experience: user.experience || [{
          company: "",
          position: "",
          startDate: "",
          endDate: "",
          description: ""
        }],
        education: user.education || [{
          institution: "",
          degree: "",
          field: "",
          startDate: "",
          endDate: "",
          gpa: ""
        }],
        skills: user.skills || "",
        languages: user.languages || "",
        certifications: user.certifications || "",
        references: user.references || ""
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === 'file') {
      setFormData(prev => ({
        ...prev,
        [name]: files[0] || null
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleExperienceChange = (index, field, value) => {
    setFormData(prev => {
      const newExperience = [...prev.experience];
      newExperience[index] = {
        ...newExperience[index],
        [field]: value
      };
      return {
        ...prev,
        experience: newExperience
      };
    });
  };

  const handleEducationChange = (index, field, value) => {
    setFormData(prev => {
      const newEducation = [...prev.education];
      newEducation[index] = {
        ...newEducation[index],
        [field]: value
      };
      return {
        ...prev,
        education: newEducation
      };
    });
  };

  const addExperience = () => {
    setFormData(prev => ({
      ...prev,
      experience: [...prev.experience, {
        company: "",
        position: "",
        startDate: "",
        endDate: "",
        description: ""
      }]
    }));
  };

  const addEducation = () => {
    setFormData(prev => ({
      ...prev,
      education: [...prev.education, {
        institution: "",
        degree: "",
        field: "",
        startDate: "",
        endDate: "",
        gpa: ""
      }]
    }));
  };

  const removeExperience = (index) => {
    setFormData(prev => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index)
    }));
  };

  const removeEducation = (index) => {
    setFormData(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }));
  };

  const handleCvUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    console.log('[Frontend] CV file selected:', {
      name: file.name,
      type: file.type,
      size: file.size
    });
    
    setCvUploadLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append('cvFile', file);

      console.log('[Frontend] Starting CV analysis request to /api/analyze-cv');
      const response = await fetch('/api/analyze-cv', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      console.log('[Frontend] Response status:', response.status);
      
      const result = await response.json();
      console.log('[Frontend] CV analysis result:', result);

      if (!response.ok) {
        console.error('[Frontend] API request failed with status:', response.status);
        const errorMessage = result.error || `Server error: ${response.status}`;
        setError(errorMessage);
        return;
      }

      if (result.success) {
        console.log('[Frontend] Populating form with extracted data...');
        const extractedData = result.data;
        
        console.log('[Frontend] Extracted data preview:', {
          name: extractedData.name,
          surname: extractedData.surname,
          experienceCount: extractedData.experience?.length || 0,
          educationCount: extractedData.education?.length || 0
        });
        
        setFormData(prev => ({
          ...prev,
          name: extractedData.name || "",
          surname: extractedData.surname || "",
          phone: extractedData.phone || "",
          address: extractedData.address || "",
          city: extractedData.city || "",
          country: extractedData.country || "",
          postalCode: extractedData.postalCode || "",
          linkedin: extractedData.linkedin || "",
          github: extractedData.github || "",
          portfolio: extractedData.portfolio || "",
          summary: extractedData.summary || "",
          targetPosition: extractedData.targetPosition || "",
          experience: extractedData.experience && extractedData.experience.length > 0 
            ? extractedData.experience 
            : [{
                company: "",
                position: "",
                startDate: "",
                endDate: "",
                description: ""
              }],
          education: extractedData.education && extractedData.education.length > 0
            ? extractedData.education
            : [{
                institution: "",
                degree: "",
                field: "",
                startDate: "",
                endDate: "",
                gpa: ""
              }],
          skills: extractedData.skills || "",
          languages: extractedData.languages || "",
          certifications: extractedData.certifications || "",
          references: extractedData.references || ""
        }));
        console.log('[Frontend] Form populated successfully!');
        
        // Auto-save the CV data to database
        try {
          console.log('[Frontend] Auto-saving CV data to database...');
          
          // Helper function to ensure string values
          const ensureString = (value) => {
            if (Array.isArray(value)) return "";
            return value || "";
          };
          
          const saveData = {
            name: ensureString(extractedData.name),
            surname: ensureString(extractedData.surname),
            phone: ensureString(extractedData.phone),
            address: ensureString(extractedData.address),
            city: ensureString(extractedData.city),
            country: ensureString(extractedData.country),
            postalCode: ensureString(extractedData.postalCode),
            linkedin: ensureString(extractedData.linkedin),
            github: ensureString(extractedData.github),
            portfolio: ensureString(extractedData.portfolio),
            summary: ensureString(extractedData.summary),
            targetPosition: ensureString(extractedData.targetPosition),
            experience: JSON.stringify(
              extractedData.experience && Array.isArray(extractedData.experience) && extractedData.experience.length > 0
                ? extractedData.experience
                : [{company: "", position: "", startDate: "", endDate: "", description: ""}]
            ),
            education: JSON.stringify(
              extractedData.education && Array.isArray(extractedData.education) && extractedData.education.length > 0
                ? extractedData.education
                : [{institution: "", degree: "", field: "", startDate: "", endDate: "", gpa: ""}]
            ),
            skills: ensureString(extractedData.skills),
            languages: ensureString(extractedData.languages),
            certifications: ensureString(extractedData.certifications),
            references: ensureString(extractedData.references)
          };
          
          await updateUser(saveData);
          console.log('[Frontend] CV data automatically saved to database');
        } catch (saveError) {
          console.error('[Frontend] Auto-save failed:', saveError);
        }
      } else {
        console.error('[Frontend] CV analysis failed:', result.error);
        setError(result.error || "Failed to analyze CV");
      }
    } catch (err) {
      console.error('[Frontend] CV upload error:', err);
      console.error('[Frontend] Error details:', err.message);
      setError(`Error uploading CV: ${err.message}. Please try again.`);
    } finally {
      setCvUploadLoading(false);
      e.target.value = '';
    }
  };

  const handleResetProfile = async () => {
    if (!window.confirm('Are you sure you want to reset your profile? This will clear all data except your email and password.')) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      console.log('[Frontend] Resetting profile...');
      const response = await fetch('/api/auth/reset-profile', {
        method: 'POST',
        credentials: 'include'
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to reset profile');
      }

      console.log('[Frontend] Profile reset successful');
      
      // Update local form data
      setFormData({
        email: user.email || "",
        password: "",
        name: "",
        surname: "",
        birthday: "",
        targetPosition: "",
        cvFile: null,
        phone: "",
        address: "",
        city: "",
        country: "",
        postalCode: "",
        linkedin: "",
        github: "",
        portfolio: "",
        summary: "",
        experience: [{
          company: "",
          position: "",
          startDate: "",
          endDate: "",
          description: ""
        }],
        education: [{
          institution: "",
          degree: "",
          field: "",
          startDate: "",
          endDate: "",
          gpa: ""
        }],
        skills: "",
        languages: "",
        certifications: "",
        references: ""
      });

      // Reload user data
      window.location.reload();
    } catch (err) {
      console.error('[Frontend] Reset error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const submitData = { ...formData };
      if (formData.cvFile) {
        // For now, just store the filename
        submitData.cvFile = formData.cvFile.name;
      }
      // Serialize arrays for JSON transmission
      submitData.experience = JSON.stringify(formData.experience);
      submitData.education = JSON.stringify(formData.education);
      
      await updateUser(submitData);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-modal">
      <h2>{t('profile.title', { defaultValue: 'Profile Settings' })}</h2>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>{t('profile.email', { defaultValue: 'Email' })}</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>{t('profile.password', { defaultValue: 'New Password (leave empty to keep current)' })}</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder={t('profile.passwordPlaceholder', { defaultValue: 'Leave empty to keep current password' })}
          />
        </div>

        <div className="form-group">
          <label>{t('profile.name', { defaultValue: 'First Name' })}</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>{t('profile.surname', { defaultValue: 'Last Name' })}</label>
          <input
            type="text"
            name="surname"
            value={formData.surname}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>{t('profile.birthday', { defaultValue: 'Birthday' })}</label>
          <input
            type="date"
            name="birthday"
            value={formData.birthday}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <button type="button" onClick={() => setShowAdvanced(!showAdvanced)} className="advanced-toggle">
            {showAdvanced ? 'Hide' : 'Show'} Advanced Options
          </button>
        </div>

        {showAdvanced && (
          <>
            <div className="form-group">
              <label>{t('profile.targetPosition', { defaultValue: 'Target Position' })}</label>
              <input
                type="text"
                name="targetPosition"
                value={formData.targetPosition}
                onChange={handleChange}
                placeholder={t('profile.targetPositionPlaceholder', { defaultValue: 'e.g. Software Engineer' })}
              />
            </div>

            <div className="cv-form-section">
              <h3>Professional Summary</h3>
              <div className="form-group">
                <label>{t('profile.summary', { defaultValue: 'Professional Summary' })}</label>
                <textarea
                  name="summary"
                  value={formData.summary}
                  onChange={handleChange}
                  placeholder="Brief overview of your professional background and goals"
                  rows={4}
                />
              </div>
            </div>

            <div className="cv-form-section">
              <h3>Contact Information</h3>
              <div className="form-group">
                <label>{t('profile.phone', { defaultValue: 'Phone Number' })}</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div className="form-group">
                <label>{t('profile.address', { defaultValue: 'Address' })}</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="123 Main St"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>{t('profile.city', { defaultValue: 'City' })}</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="New York"
                  />
                </div>
                <div className="form-group">
                  <label>{t('profile.postalCode', { defaultValue: 'Postal Code' })}</label>
                  <input
                    type="text"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleChange}
                    placeholder="10001"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>{t('profile.country', { defaultValue: 'Country' })}</label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  placeholder="United States"
                />
              </div>
            </div>

            <div className="cv-form-section">
              <h3>Professional Profiles</h3>
              <div className="form-group">
                <label>{t('profile.linkedin', { defaultValue: 'LinkedIn URL' })}</label>
                <input
                  type="url"
                  name="linkedin"
                  value={formData.linkedin}
                  onChange={handleChange}
                  placeholder="https://linkedin.com/in/yourprofile"
                />
              </div>
              <div className="form-group">
                <label>{t('profile.github', { defaultValue: 'GitHub URL' })}</label>
                <input
                  type="url"
                  name="github"
                  value={formData.github}
                  onChange={handleChange}
                  placeholder="https://github.com/yourusername"
                />
              </div>
              <div className="form-group">
                <label>{t('profile.portfolio', { defaultValue: 'Portfolio URL' })}</label>
                <input
                  type="url"
                  name="portfolio"
                  value={formData.portfolio}
                  onChange={handleChange}
                  placeholder="https://yourportfolio.com"
                />
              </div>
            </div>

            <div className="cv-form-section">
              <h3>Work Experience</h3>
              {formData.experience.map((exp, index) => (
                <div key={index} className="experience-item">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Company</label>
                      <input
                        type="text"
                        value={exp.company}
                        onChange={(e) => handleExperienceChange(index, 'company', e.target.value)}
                        placeholder="Company Name"
                      />
                    </div>
                    <div className="form-group">
                      <label>Position</label>
                      <input
                        type="text"
                        value={exp.position}
                        onChange={(e) => handleExperienceChange(index, 'position', e.target.value)}
                        placeholder="Job Title"
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Start Date</label>
                      <input
                        type="month"
                        value={exp.startDate}
                        onChange={(e) => handleExperienceChange(index, 'startDate', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>End Date</label>
                      <input
                        type="month"
                        value={exp.endDate}
                        onChange={(e) => handleExperienceChange(index, 'endDate', e.target.value)}
                        placeholder="Present"
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      value={exp.description}
                      onChange={(e) => handleExperienceChange(index, 'description', e.target.value)}
                      placeholder="Describe your responsibilities and achievements"
                      rows={3}
                    />
                  </div>
                  {formData.experience.length > 1 && (
                    <button type="button" onClick={() => removeExperience(index)} className="remove-btn">
                      Remove Experience
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addExperience} className="add-btn">
                Add Experience
              </button>
            </div>

            <div className="cv-form-section">
              <h3>Education</h3>
              {formData.education.map((edu, index) => (
                <div key={index} className="education-item">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Institution</label>
                      <input
                        type="text"
                        value={edu.institution}
                        onChange={(e) => handleEducationChange(index, 'institution', e.target.value)}
                        placeholder="University Name"
                      />
                    </div>
                    <div className="form-group">
                      <label>Degree</label>
                      <input
                        type="text"
                        value={edu.degree}
                        onChange={(e) => handleEducationChange(index, 'degree', e.target.value)}
                        placeholder="Bachelor's, Master's, etc."
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Field of Study</label>
                      <input
                        type="text"
                        value={edu.field}
                        onChange={(e) => handleEducationChange(index, 'field', e.target.value)}
                        placeholder="Computer Science, Business, etc."
                      />
                    </div>
                    <div className="form-group">
                      <label>GPA (optional)</label>
                      <input
                        type="text"
                        value={edu.gpa}
                        onChange={(e) => handleEducationChange(index, 'gpa', e.target.value)}
                        placeholder="3.8"
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Start Date</label>
                      <input
                        type="month"
                        value={edu.startDate}
                        onChange={(e) => handleEducationChange(index, 'startDate', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>End Date</label>
                      <input
                        type="month"
                        value={edu.endDate}
                        onChange={(e) => handleEducationChange(index, 'endDate', e.target.value)}
                      />
                    </div>
                  </div>
                  {formData.education.length > 1 && (
                    <button type="button" onClick={() => removeEducation(index)} className="remove-btn">
                      Remove Education
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addEducation} className="add-btn">
                Add Education
              </button>
            </div>

            <div className="cv-form-section">
              <h3>Skills & Qualifications</h3>
              <div className="form-group">
                <label>{t('profile.skills', { defaultValue: 'Skills' })}</label>
                <textarea
                  name="skills"
                  value={formData.skills}
                  onChange={handleChange}
                  placeholder="List your technical and soft skills (e.g., JavaScript, Project Management, Communication)"
                  rows={3}
                />
              </div>
              <div className="form-group">
                <label>{t('profile.languages', { defaultValue: 'Languages' })}</label>
                <input
                  type="text"
                  name="languages"
                  value={formData.languages}
                  onChange={handleChange}
                  placeholder="English (Native), Spanish (Fluent), French (Basic)"
                />
              </div>
              <div className="form-group">
                <label>{t('profile.certifications', { defaultValue: 'Certifications' })}</label>
                <textarea
                  name="certifications"
                  value={formData.certifications}
                  onChange={handleChange}
                  placeholder="List your professional certifications"
                  rows={2}
                />
              </div>
              <div className="form-group">
                <label>{t('profile.references', { defaultValue: 'References' })}</label>
                <textarea
                  name="references"
                  value={formData.references}
                  onChange={handleChange}
                  placeholder="Available upon request or list reference details"
                  rows={2}
                />
              </div>
            </div>
          </>
        )}

        <div className="modal-actions">
          <button type="button" onClick={onClose} className="cancel-btn">
            {t('profile.cancel', { defaultValue: 'Cancel' })}
          </button>
          <button type="submit" disabled={loading} className="save-btn">
            {loading ? t('profile.saving', { defaultValue: 'Saving...' }) : t('profile.save', { defaultValue: 'Save Changes' })}
          </button>
        </div>
      </form>

      <div className="cv-upload-section">
        <input
          type="file"
          id="cv-upload-input"
          accept=".pdf,.doc,.docx,.txt"
          onChange={handleCvUpload}
          style={{ display: 'none' }}
        />
        <button 
          type="button"
          onClick={() => document.getElementById('cv-upload-input').click()}
          disabled={cvUploadLoading}
          className="upload-cv-btn"
        >
          {cvUploadLoading ? 'Analyzing CV...' : 'Upload CV'}
        </button>
        <button 
          type="button"
          onClick={handleResetProfile}
          disabled={loading}
          className="reset-profile-btn"
          style={{ marginLeft: '10px', backgroundColor: '#dc3545', color: 'white' }}
        >
          {loading ? 'Resetting...' : 'Reset Profile'}
        </button>
        {cvUploadLoading && (
          <p className="upload-status">Analyzing your CV and populating the form...</p>
        )}
      </div>
    </div>
  );
}