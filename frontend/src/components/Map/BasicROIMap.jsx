import React, { useState, useEffect } from 'react';

const BasicROIMap = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  // Generate sample Austin properties
  useEffect(() => {
    const generateSampleProperties = () => {
      const austinZipCodes = ['78701', '78702', '78703', '78704', '78705'];
      const sampleData = [];
      
      for (let i = 0; i < 15; i++) {
        const listPrice = 200000 + Math.random() * 300000;
        const estimatedRent = listPrice * (0.008 + Math.random() * 0.004);
        const roiScore = ((estimatedRent * 12) / listPrice) * 100;
        
        sampleData.push({
          id: i + 1,
          address: `${1000 + i} Austin St`,
          city: 'Austin',
          state: 'TX',
          zipCode: austinZipCodes[Math.floor(Math.random() * austinZipCodes.length)],
          listPrice: Math.round(listPrice),
          estimatedRent: Math.round(estimatedRent),
          roiScore: Math.round(roiScore * 100) / 100,
        });
      }
      
      return sampleData.sort((a, b) => b.roiScore - a.roiScore);
    };

    setTimeout(() => {
      setProperties(generateSampleProperties());
      setLoading(false);
    }, 1000);
  }, []);

  const getROIColor = (roiScore) => {
    if (roiScore >= 8) return '#10b981'; // green
    if (roiScore >= 6) return '#f59e0b'; // yellow
    if (roiScore >= 4) return '#f97316'; // orange
    return '#ef4444'; // red
  };

  const getROISize = (roiScore) => {
    if (roiScore >= 8) return 24;
    if (roiScore >= 6) return 20;
    if (roiScore >= 4) return 16;
    return 12;
  };

  if (loading) {
    return (
      <div style={{ 
        background: 'white', 
        borderRadius: '12px', 
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', 
        padding: '32px',
        textAlign: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{
            width: '32px',
            height: '32px',
            border: '2px solid #3b82f6',
            borderTop: '2px solid transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <span style={{ marginLeft: '12px', color: '#6b7280' }}>Loading Austin properties...</span>
        </div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ 
      background: 'white', 
      borderRadius: '12px', 
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', 
      overflow: 'hidden' 
    }}>
      {/* Header */}
      <div style={{ 
        background: 'linear-gradient(to right, #2563eb, #7c3aed)', 
        color: 'white', 
        padding: '24px' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ 
              fontSize: '24px', 
              fontWeight: 'bold', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              margin: 0
            }}>
              📍 ROI Heat Map
            </h2>
            <p style={{ 
              color: 'rgba(219, 234, 254, 1)', 
              marginTop: '4px',
              margin: '4px 0 0 0'
            }}>
              {properties.length} Austin properties • API Conservation Mode
            </p>
          </div>
        </div>
      </div>

      {/* API Conservation Notice */}
      <div style={{ 
        background: '#fefce8', 
        borderLeft: '4px solid #facc15', 
        padding: '16px' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ flexShrink: 0 }}>
            ⚡
          </div>
          <div style={{ marginLeft: '12px' }}>
            <p style={{ 
              fontSize: '14px', 
              color: '#a16207',
              margin: 0
            }}>
              <strong>API Conservation Mode:</strong> Focused on Austin, TX to preserve RentCast API calls. 
              <span style={{ fontWeight: '500' }}> Sample data shown for testing.</span>
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '24px' }}>
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            color: '#1f2937', 
            marginBottom: '8px',
            margin: '0 0 8px 0'
          }}>
            Property ROI Visualization
          </h3>
          <p style={{ 
            fontSize: '14px', 
            color: '#6b7280',
            margin: 0
          }}>
            Circle size = ROI potential • Color = Performance tier
          </p>
        </div>

        {/* Legend */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '24px', 
          marginBottom: '24px', 
          padding: '16px', 
          background: '#f9fafb', 
          borderRadius: '8px',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ 
              width: '24px', 
              height: '24px', 
              background: '#10b981', 
              borderRadius: '50%' 
            }}></div>
            <span style={{ fontSize: '14px' }}>Excellent (8%+)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ 
              width: '20px', 
              height: '20px', 
              background: '#f59e0b', 
              borderRadius: '50%' 
            }}></div>
            <span style={{ fontSize: '14px' }}>Good (6-8%)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ 
              width: '16px', 
              height: '16px', 
              background: '#f97316', 
              borderRadius: '50%' 
            }}></div>
            <span style={{ fontSize: '14px' }}>Fair (4-6%)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ 
              width: '12px', 
              height: '12px', 
              background: '#ef4444', 
              borderRadius: '50%' 
            }}></div>
            <span style={{ fontSize: '14px' }}>Poor (&lt;4%)</span>
          </div>
        </div>

        {/* Properties Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '16px' 
        }}>
          {properties.map((property) => (
            <div key={property.id} style={{ 
              border: '1px solid #e5e7eb', 
              borderRadius: '8px', 
              padding: '16px',
              transition: 'box-shadow 0.2s',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => e.target.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}
            onMouseLeave={(e) => e.target.style.boxShadow = 'none'}
            >
              <div style={{ 
                display: 'flex', 
                alignItems: 'flex-start', 
                justifyContent: 'space-between', 
                marginBottom: '12px' 
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ 
                    width: `${getROISize(property.roiScore)}px`,
                    height: `${getROISize(property.roiScore)}px`,
                    background: getROIColor(property.roiScore),
                    borderRadius: '50%',
                    flexShrink: 0
                  }}></div>
                  <div>
                    <h4 style={{ 
                      fontWeight: '500', 
                      color: '#1f2937',
                      margin: '0 0 4px 0',
                      fontSize: '16px'
                    }}>
                      {property.address}
                    </h4>
                    <p style={{ 
                      fontSize: '14px', 
                      color: '#6b7280',
                      margin: 0
                    }}>
                      {property.city}, {property.state} {property.zipCode}
                    </p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ 
                    fontSize: '18px', 
                    fontWeight: 'bold', 
                    color: '#10b981' 
                  }}>
                    {property.roiScore}%
                  </div>
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#6b7280' 
                  }}>
                    ROI
                  </div>
                </div>
              </div>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '16px', 
                fontSize: '14px' 
              }}>
                <div>
                  <div style={{ color: '#6b7280' }}>List Price</div>
                  <div style={{ fontWeight: '500' }}>
                    ${property.listPrice.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#6b7280' }}>Est. Rent</div>
                  <div style={{ fontWeight: '500' }}>
                    ${property.estimatedRent.toLocaleString()}/mo
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Show more button */}
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <button style={{ 
            background: '#3b82f6', 
            color: 'white', 
            padding: '8px 24px', 
            borderRadius: '8px', 
            border: 'none',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.background = '#2563eb'}
          onMouseLeave={(e) => e.target.style.background = '#3b82f6'}
          >
            Load More Properties
          </button>
        </div>
      </div>
    </div>
  );
};

export default BasicROIMap;
